###### Simple wrapper over js fetch api.  


##### dependencies

No dependencies

### Install
```
npm install sfapi
```

### How to use 
##### Simple example
#
```javascript
import { get } from 'fetch-simple'

get('https://jsonplaceholder.typicode.com/todos/1')
    .then((jsonData) => console.log(jsonData))
```
or

```javascript
import sfApi from 'sfapi'

sfApi.get('https://jsonplaceholder.typicode.com/todos/1')
    .then((jsonData) => console.log(jsonData))
```

#### Available methods
##### main:
- **get** - make `GET` request 
- **remove** - make `DELETE` request
- **post** - make `POST` request
- **put** - make `PUT` request

###### Return actual response content (by default text or json)

###### take parameters:
- `url` - **required**,  *string*, endpoint adress
- `data` - *payload object*. For *get*, and *remove*  methods will be automaticaly transformed to queryString:

```javascript
get('https://jsonplaceholder.typicode.com/todos/1', {q: 'test', sort: 'asc'})
```
will results in request to url `https://jsonplaceholder.typicode.com/todos/1?q=test&sort=asc`

For *post* and *put* methods payload will be transformed to `FormData`

> **Note**: By default header `'Content-Type': 'application/x-www-form-urlencoded'` is setted for all this requests

- `options` - *object*, options and configurations:
  - **_method_** - *string*, request method (*GET, POST, PUT, DELETE, OPTION* or whatever)
  - **_headers_** - *object*, define additional request headers ({'header-name': 'header-value'})
  - **_responseType_** - *string*, one of  `'text'`  `'json'` `'blob'` `'formData'` `'arrayBuffer'` - expected type of response. By default `'text'` is used (now it also try to parse json, but this will be deprecated in future)
  - **_body_** - *string* or *FormData*, request body can be also set directly if some custom logic is needed

##### additional methods:

- **removeJSON** - same as *remove*, but convert payload and send as JSON
- **postJSON** - same as *post*, but convert payload and send as JSON
- **putJSON** - same as *put*, but convert payload and send as JSON
> **Note**: for this methods header `'Content-Type'` is set to `'application/json'` 

- **postFile** - same as *post*, but accept file as `data` parameter

- **setConfiguration** - configuration methotd, that can change some general behaviorof other methods, 
  - accept object with fields
   --  **_onError_** - on error hook (if response is not ok), takes parameters:
       - `remoteError` - *Error* - error, that happened
       - `response` - *Response* - actual network response object

    -- **_getAccessToken_** - function that returns JWT token as *string* or *Promise*. If setted, this method will be called before all requests, authentication header with token will be added to headers.
