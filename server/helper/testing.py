from pip._vendor import requests
from pip._vendor import sys

url = "https://slack.com/api/oauth.v2.access"
client_id = "920553244658.2619617391527".encode('utf-8')
client_secret = "c63b10bdf1a3e2b48e2f496f6481c884".encode('utf-8')
data = {
    'code': sys.argv[1],
}

auth = (client_id, client_secret)
resp = requests.post(url, data=data, auth=auth)
# print(resp.get_json()['access_token'])
print(resp.text)
sys.stdout.flush()
