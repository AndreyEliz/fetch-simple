import 'whatwg-fetch'; // fetch polifill
import {toast} from 'react-toastify';

type responseType = 'text' | 'json' | 'blob' | 'formData' | 'arrayBuffer'

type fetchOptions = {
    method?: string;
    headers?: any;
    responseType?: responseType;
    body?: string | FormData;
};

type config = {
    getAccessToken?(): Promise<string> | string;
    errorHandlers?: any
}

interface IApiService {
    get(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    remove(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    removeJSON(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    post(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    postJSON(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    postFile(url: string, file: any, options: fetchOptions): Promise<Response | never | never>
    getFileAsDataUrl(url: string, options: fetchOptions): Promise<Response | never | never>
    put(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    putJSON(url: string, data: object, options: fetchOptions): Promise<Response | never | never>
    setConfiguration(config: config): void
}

const getHeadersWithAuthorization = (headers:any, token: string) => {
    const authorization = 'Bearer ' + token;
    return token ? {...headers, authorization} : {...headers};
};

/**
 * TODO: configuration
 */
class ApiService implements IApiService {
    private getAuthToken: () => Promise<string> | string

    private authenticate(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.getAuthToken ? 
            resolve(this.getAuthToken()) 
            : 
            resolve(localStorage.getItem('accessToken'))
        }) 
    }

    private fetchData (url:string, options:fetchOptions={}) {
        return this.authenticate()
            .then((token) => {
                const headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...getHeadersWithAuthorization(options.headers, token),
                };
                return fetch(url, {...options, headers})
            }) 
            .then(handleErrors)
            .then((response: Response) => handleResponse(response, options.responseType))
            .catch((e) => {
                throw e;
            });
    };

    public setConfiguration (config) {
        this.getAuthToken = config.getAuthToken
    }

    public get (url: string, data={}, options:fetchOptions={}) {
        const requestData = generateFormData(data);
        const requestUrl = requestData ? `${url}?${requestData}` : url;
        const getData = () => this.fetchData(requestUrl, {
            method: 'GET',
            ...options
    });
        return getData();
    }

    public remove (url: string, data={}, options:fetchOptions={}) {
        const requestData = generateFormData(data);
        const requestUrl = requestData ? `${url}?${requestData}` : url;
        const getData = () => this.fetchData(requestUrl, {
            method: 'DELETE',
            ...options
        });
        return getData();
   };

    public removeJSON (url: string, data={}, options:fetchOptions={}) {
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

    public post (url: string, data={}, options:fetchOptions={}) {
        const postData = () => this.fetchData(url, {
            method: 'POST',
            ...options,
            body: generateFormData(data)
        });
        return postData();
    };

    public postJSON (url: string, data={}, options:fetchOptions={}) {
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

    public postFile (url:string, file:any=null, options:fetchOptions={}) {
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

    public getFileAsDataUrl (url:string, options:fetchOptions={}) {
        const getData = () => this.fetchData(url, {
            ...options
        });
        return getData();
    };

    public put (url:string, data={}, options:fetchOptions={}) {
        const putData = () => this.fetchData(url, {
            method: 'PUT',
            ...options,
            body: generateFormData(data)
        });
        return putData();
    };

    public putJSON (url:string, data={}, options:fetchOptions={}) {
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
    for (let key in obj ) {
        if (obj[key] || obj[key] === 0 || obj[key] === '') {
            // eslint-disable-next-line
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

const throwNetworkError = (remoteError:Error, response:Response) => {
    if (response.status === 401) throw new AuthError(remoteError.message);
    if (response.status === 404) throw new NotFoundError(remoteError.message);
    if (response.status === 400) throw new BadRequestError(remoteError.message);
    else throw Error(remoteError.message);
};

const handleErrors = (response:Response) => {
    return response.ok ?
        Promise.resolve(response)
        :
        response.json()
            .then((e) => throwNetworkError(e, response))
            .catch((e) => throwNetworkError(e, response));
};

/**
 * Authentication error
 */
export class AuthError extends Error {
    constructor(...props:any[]) {
        super(...props);
        this.name = 'AuthError';
    }
}

/**
 * Bad request error
 */
export class BadRequestError extends Error {
    constructor(...props:any[]) {
        super(...props);
        this.name = 'BadRequestError';
    }
}

/**
 * Not found error
 */
export class NotFoundError extends Error {
    constructor(...props:any[]) {
        super(...props);
        this.name = 'NotFoundError';
    }
}

const api = new ApiService();

export const { 
    get,
    remove,
    removeJSON,
    post,
    postJSON,
    postFile,
    getFileAsDataUrl,
    put,
    putJSON,
} = api;


/**
 * TODO - rewrite on thunk
 * @param dispatch 
 * @param error 
 * @param customErrorHandlers 
 */
export const handleError = (error: Error, customErrorHandlers={}) => {
    const toastId = 'connectionError';

    const errorHandlers: any = {
        'AuthError': (data: any) => {
            toast('Ошибка авторизации', {type: 'error', toastId: data.toastId});
        },
        'BadRequestError': (data: any) => toast(data.error.message, {type: 'error', toastId: data.toastId}),
        'NotFoundError': (data: any) => toast('Запрашиваемый ресурс не найден', {type: 'error', toastId: data.toastId}),
        'unknownError': (data: any) => toast('Ошибка соединения', {type: 'error', toastId: data.toastId}),
        ...customErrorHandlers
    };
    
    const errorHandler = errorHandlers[error.name] || errorHandlers.unknownError;
    errorHandler({toastId, error});
};
