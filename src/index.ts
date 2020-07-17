import AuthError from "./errors/AuthError";
import NotFoundError from "./errors/NotFoundError";
import BadRequestError from "./errors/BadRequestError";

type responseType = 'text' | 'json' | 'blob' | 'formData' | 'arrayBuffer'

type fetchOptions = {
    method?: string;
    headers?: any;
    responseType?: responseType;
    body?: string | FormData;
};

type configType = {
    getAccessToken?(): Promise<string> | string;
    onError?(error: Error, response: Response): any
}

interface IApiService {
    get(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    remove(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    removeJSON(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    post(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    postJSON(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    postFile(url: string, file: any, options: fetchOptions): Promise<Response | never | never>
    put(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    putJSON(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    setConfiguration(config: configType): void
}

const getHeadersWithAuthorization = (headers:any, token: string) => {
    const authorization = 'Bearer ' + token;
    return token ? {...headers, authorization} : {...headers};
};

/**
 * TODO:
 * - improve error handling (default error handling for typical network statuses),
 * - fetching progress
 * - disable parsing json from text responses
 */
class ApiService implements IApiService {

    private getAccessToken: (() => Promise<string> | string ) | undefined
    private onError?: (error: Error, response: Response) => any

    private authenticate = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            this.getAccessToken ? 
            resolve(this.getAccessToken()) 
            : 
            resolve(localStorage.getItem('accessToken') || '')
        }) 
    }

    private fetchData = (url:string, options:fetchOptions={}) => {
        return this.authenticate()
            .then((token) => {
                const headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...getHeadersWithAuthorization(options.headers, token),
                };
                return fetch(url, {...options, headers})
            }) 
            .then(this.handleErrors)
            .then((response: Response) => handleResponse(response, options.responseType))
            .catch((e) => {
                throw e;
            });
    };

    private throwNetworkError = (remoteError:Error, response:Response) => {
        if (this.onError) this.onError(remoteError, response)
        if (response.status === 401) throw new AuthError(remoteError.message)
        if (response.status === 404) throw new NotFoundError(remoteError.message)
        if (response.status === 400) throw new BadRequestError(remoteError.message)
        else throw Error(remoteError.message);
    };
    
    private handleErrors = (response:Response): Response | PromiseLike<any> => {
        return response.ok ?
            Promise.resolve(response)
            :
            response.json()
                .then((e) => this.throwNetworkError(e, response))
                .catch((e) => this.throwNetworkError(e, response));
    };

    public setConfiguration = (config: configType) => {
        this.getAccessToken = config.getAccessToken
        this.onError = config.onError
    }

    public get = (url: string, data={}, options:fetchOptions={}) => {
        const requestData = generateFormData(data);
        const requestUrl = requestData ? `${url}?${requestData}` : url;
        const getData = () => this.fetchData(requestUrl, {
            method: 'GET',
            ...options
        });
        return getData();
    }

    public remove = (url: string, data={}, options:fetchOptions={}) => {
        const requestData = generateFormData(data);
        const requestUrl = requestData ? `${url}?${requestData}` : url;
        const getData = () => this.fetchData(requestUrl, {
            method: 'DELETE',
            ...options
        });
        return getData();
   };

    public removeJSON = (url: string, data={}, options:fetchOptions={}) => {
        options.headers = options.headers || {};
        options.headers['Content-Type'] = 'application/json';
        options.headers['Accept'] = '*/*';
        const removeData = () => this.fetchData(url, {
            method: 'DELETE',
            ...options,
            body: JSON.stringify(data)
        });
        return removeData();
    };

    public post = (url: string, data={}, options:fetchOptions={}) => {
        const postData = () => this.fetchData(url, {
            method: 'POST',
            ...options,
            body: generateFormData(data)
        });
        return postData();
    };

    public postJSON = (url: string, data={}, options:fetchOptions={}) => {
        options.headers = options.headers || {};
        options.headers['Content-Type'] = 'application/json';
        options.headers['Accept'] = 'application/json';
        const postData = () => this.fetchData(url, {
            method: 'POST',
            ...options,
            body: JSON.stringify(data)
        });
        return postData();
    };

    public postFile = (url:string, file:any=null, options:fetchOptions={}) => {
        options.headers = options.headers || {};
        const formData = new FormData();
        formData.append('file', file);
        const postData = () => this.fetchData(url, {
            'method': 'POST',
            ...options,
            'body': formData
        });
        return postData();
    };

    public put = (url:string, data={}, options:fetchOptions={}) => {
        const putData = () => this.fetchData(url, {
            method: 'PUT',
            ...options,
            body: generateFormData(data)
        });
        return putData();
    };

    public putJSON = (url:string, data={}, options:fetchOptions={}) => {
        options.headers = options.headers || {};
        options.headers['Content-Type'] = 'application/json';
        options.headers['Accept'] = '*/*';
        const putData = () => this.fetchData(url, {
            method: 'PUT',
            ...options,
            body: JSON.stringify(data)
        });
        return putData();
    };

}


const generateFormData = (obj:any) => {
    let formData = '';
    for (const key in obj ) {
        if (obj[key] || obj[key] === 0 || obj[key] === '') {
            if (formData != '') {
                formData += '&';
            }
            if (obj[key] === '') formData += key;
            else formData += key + '=' + encodeURIComponent(obj[key]);
        }
    }
    return formData;
};

/**
 * check if token expires
 */
export const isAccessTokenExpired = () => {
    const accessTokenExpDate = parseInt(localStorage.getItem('expiresIn') || '', 10);
    const nowTime = Math.floor(Date.now());
    return accessTokenExpDate <= nowTime;
};


const handleResponse = (response:Response, asType: responseType = 'text') => {
    if (asType === 'text')  return response.text().then((text) => {
        try {
            return JSON.parse(text);
        } catch (e) {
            return text ? text: {};
        }
    })
    else if (asType === 'blob')  return response.blob()
    else if (asType === 'arrayBuffer') return response.arrayBuffer()
    else if (asType === 'formData') return response.formData()
    else if (asType === 'json') return response.json()
};

const sfApi = new ApiService;

export const { 
    get,
    remove,
    removeJSON,
    post,
    postJSON,
    postFile,
    put,
    putJSON,
    setConfiguration,
} = sfApi;

export default sfApi;