const { RESTDataSource } = require('apollo-datasource-rest')

export class ApiPlaceholder extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = 'https://example.com'
  }
}

export const apiSource = () => ({
  ApiPlaceholder: new ApiPlaceholder(),
})
