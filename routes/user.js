
var OAuth2 = require('OAuth').OAuth2;
var client_id = "YOUR CLIENT ID";
var client_secret = "YOUR SECRET";
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

}

exports.logout = function(req, res) {
	req.session.destroy();
	res.redirect('/');
}
