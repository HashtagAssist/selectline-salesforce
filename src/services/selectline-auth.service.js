const axios = require('axios');
const winston = require('winston');
const https = require('https');
const SelectLineToken = require('../models/selectline-token.model');
require('dotenv').config();

class SelectLineAuthService {
  constructor() {
    this.baseUrl = process.env.SELECTLINE_API_URL;
    this.credentials = {
      UserName: process.env.SELECTLINE_USERNAME,
      Password: process.env.SELECTLINE_PASSWORD,
      AppKey: process.env.SELECTLINE_APPKEY,
    };
    
   

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/selectline.log' })
      ]
    });
  }

  /**
   * Returns the current token from DB or gets a new one
   */
  async getToken() {
    try {
      // Versuche Token aus der Datenbank zu holen
      const tokenDoc = await SelectLineToken.findOne()
        .sort({ createdAt: -1 })
        .exec();

      if (tokenDoc) {
        this.logger.debug('Using existing token from database');
        return tokenDoc.token;
      }

      // Wenn kein Token in der DB, hole einen neuen
      return await this.login();
    } catch (error) {
      this.logger.error('Error getting token', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  async getOldToken() {
      // Versuche Token aus der Datenbank zu holen
      const tokenDoc = await SelectLineToken.findOne()
        .sort({ createdAt: -1 })
        .exec();

      if (tokenDoc) {
        this.logger.debug('Using existing token from database');
        return tokenDoc.token;
      }
      // Wenn kein Token in der DB, hole einen neuen
   
  }

  /**
   * Login to the SelectLine API and store token in DB
   */
  async login() {
    try {
      const response = await this.axiosInstance.post(`${this.baseUrl}/login`, this.credentials);
      const token = response.data.AccessToken;

      // Speichere den neuen Token in der Datenbank
      await SelectLineToken.create({ token });

      this.logger.info('Successfully logged in to SelectLine API and stored token');
      return token;
    } catch (error) {
      this.logger.error('Error logging in to SelectLine API', { 
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw error;
    }
  }
  
  /**
   * Logout from SelectLine API and remove token from DB
   */
  async logout() {
    try {
      // Hole den aktuellen Token
      const token = await this.getOldToken();
      
      // Erstelle einen neuen Client mit dem Token
      const client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `LoginId ${token}`
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      });

      // Sende Logout-Request an SelectLine API
      const response = await client.post('/logout')
      
      // Prüfe ob Logout erfolgreich war (Status 204)
      if (response.status === 204) {
        // Lösche Token aus der Datenbank
        await SelectLineToken.deleteMany({});
        this.logger.info('Successfully logged out from SelectLine API and removed token');
        return {token:token, message:'Erfolgreich von SelectLine abgemeldet'};
      }
      
      
      throw new Error('Unerwarteter Status Code beim Logout');
    } catch (error) {
      if (error.response.status === 403) {
        // Lösche Token aus der Datenbank
        await SelectLineToken.deleteMany({});
        this.logger.info('Successfully logged out from SelectLine API and removed token');
        return true;
      }else{
        this.logger.error('Fehler beim Logout von SelectLine API', { 
          error: error.message,
          stack: error.stack,
          apiError: error.response?.data,        // API Fehlermeldung
          apiStatus: error.response?.status,     // HTTP Status Code
          apiHeaders: error.response?.headers,   // Response Headers
        apiRequest: {                          // Request Details
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });

        throw new Error(JSON.stringify(error.response?.data));
      }

    }
  }

  /**
   * Creates a configured axios client with the auth header set
   */
  async getClient() {
    const token = await this.getToken();
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `LoginId ${token}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
  }

  /**
   * Makes a request to the SelectLine API and handles auth errors
   */
  async request(method, url, data = null) {
    try {
      const client = await this.getClient();
      return await client[method.toLowerCase()](url, data);
    } catch (error) {
      // Check if this is an authentication error
      if (
        error.response &&
        error.response.data &&
        error.response.data.StatusCode === "Forbidden" &&
        error.response.data.ResponseCode === "70-002" &&
        error.response.data.ResponseId === 2
      ) {
        this.logger.warn('SelectLine token expired, performing new login');
        
        // Reset token and login again
        //await this.login();
        
        // Retry the request
        const client = await this.getClient();
        return await client[method.toLowerCase()](url, data);
      }
      
      // Forward other errors
      throw error;
    }
  }

  // Helper methods for common API calls
  async get(url, params = {}) {
    return this.request('GET', url, { params });
  }

  async post(url, data) {
    return this.request('POST', url, data);
  }

  async put(url, data) {
    return this.request('PUT', url, data);
  }

  async delete(url) {
    return this.request('DELETE', url);
  }

}

// Export a singleton instance
module.exports = new SelectLineAuthService(); 