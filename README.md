Simple wrapper over js fetch api.

dependensies:

'whatwg-fetch'
'react-toastify' for notifications;

usage: 

get(url, data, options) - GET
remove(url, data, options) - DELETE

url - string, endpoint adress
data - payload object.
options - headers

removeJSON(url, data, options) - DELETE
postJSON(url, data, options) - POST

for this methods data will be puted to JSON body of reques

post(url, data, options)

