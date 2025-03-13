const axios = require('axios');
const winston = require('winston');

class SelectLineAuthService {
  constructor() {
    this.token = null;
    this.baseUrl = process.env.SELECTLINE_API_URL;
    this.credentials = {
      username: process.env.SELECTLINE_USERNAME,
      password: process.env.SELECTLINE_PASSWORD,
      // Any other required credentials
    };
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
   * Login to the SelectLine API
   */
  async login() {
    try {
      const response = await axios.post(`${this.baseUrl}/login`, this.credentials);
      this.token = response.data.token; // Assuming token is in response data
      this.logger.info('Successfully logged in to SelectLine API');
      return this.token;
    } catch (error) {
      this.logger.error('Error logging in to SelectLine API', { 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Returns the current token or gets a new one
   */
  async getToken() {
    if (!this.token) {
      return await this.login();
    }
    return this.token;
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
      }
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
        this.token = null;
        await this.login();
        
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