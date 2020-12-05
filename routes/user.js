
var OAuth2 = require('OAuth').OAuth2;
const axios = require('axios');
var client = undefined;
var access_token = undefined;

var airvantageClientId = process.env.AIRVANTAGE_CLIENT_ID;
var airvantageClientSecret = process.env.AIRVANTAGE_CLIENT_SECRET
var airvantageRegion = process.env.AIRVANTAGE_REGION
var airvantageApiUrl = 'https://' + (airvantageRegion || 'eu') + '.airvantage.net/api'

var oauth2 = new OAuth2(
		airvantageClientId,
		airvantageClientSecret, 
		airvantageApiUrl, 
		'/oauth/authorize',
		'/oauth/token', 
		null
);

exports.list = function(req, res){
  res.send("Running...");
};

exports.authconnect = function(req, res) {
	var params = []; params['response_type'] = 'code';
	res.redirect(oauth2.getAuthorizeUrl(params));
}

exports.oauth2callback = function(req, res) {
	oauth2.getOAuthAccessToken(
       req.query.code,
       {'grant_type': 'authorization_code'},
       function (e, accessToken, refresh_token, results){
       access_token = accessToken;
       req.session.lastPage = '/authorize';
       res.redirect('/authorize');
    });
}

exports.authorize = function(req, res) {
	res.render('authorize', { title: 'AirVantage Node.JS Example' });
}

exports.whoami = function(req, res) {
	res.redirect(airvantageApiUrl + "/v1/users/current");
}

exports.systems = function(req, res) {
	res.redirect(airvantageApiUrl + "/v1/systems");
}

exports.applications = function(req, res) {
	res.redirect(airvantageApiUrl + "/v1/applications");
}

exports.ips = function (req, res) {
	axios.get(airvantageApiUrl + "/v1/systems?size=0",{
		headers: {'Authorization': 'Bearer ' + access_token},
	})
  .catch(function (error) {
		console.log(error);
    res.render('sims', ERROR)		
  })
  .then(function (response) {
		var totalCount = Math.ceil(response.data.count/100);
		var subscriptions = []
		for (var i = 0; i <= totalCount; i++) {
			subscriptions.push(
				axios.get(airvantageApiUrl + "/v1/systems?fields=name,subscription&offset="+ i * 100 + "&size=100",{
					headers: {'Authorization': 'Bearer ' + access_token},
				})
			)
		}
		Promise.all(subscriptions).catch(function (error) {
			console.log(error);
			res.render('sims', "ERROR")		
		})
		.then(function (resps) {
			var systems = [].concat.apply([], resps.map(systemRes => {
				if (systemRes.data && systemRes.data.items) {
					return systemRes.data.items
				}
				return null
			}))
			var ips = systems.map(system => {
				if (system.subscription && system.subscription.ipAddress) {
					return {
						"iccid": system.name.substring(4),
						"ip_adress": system.subscription.ipAddress,
					}
				} else {
					return null
				}
			}).filter(v => v != null)
			res.render('sims', {sims:JSON.stringify(ips)})
		})
  });
}

exports.logout = function(req, res) {
	req.session.destroy();
	res.redirect('/');
}
