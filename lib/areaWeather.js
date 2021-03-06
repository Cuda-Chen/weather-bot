const axios = require("axios");
const parseWindDirection = require('./parseWindDirection');
const parseTime = require('./parseTime');
const config = require("../config");

async function getAreaWeather(area) {
    let replyMsg = '';
    try {
        let lon, lat, realAreaName = '';
        if (area.x && area.y) {
            lat = area.y;
            lon = area.x;
        } else {
            const googleGeoUrl = encodeURI(`https://maps.googleapis.com/maps/api/geocode/json?address=${area.name}&key=${config.googleMapKey}`);
            let geoRes = await axios.get(googleGeoUrl);
            // try three times
            for (let i = 0; geoRes.data.results[0].geometry == undefined && i < 3; i++) {
                geoRes = await axios.get(googleGeoUrl);
            }
            lon = geoRes.data.results[0].geometry.location.lng;
            lat = geoRes.data.results[0].geometry.location.lat;
            realAreaName = geoRes.data.results[0].formatted_address;
        }
        try {
            const openWeatherMaprUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${config.owmApiKey}`;
            const res = await axios.get(openWeatherMaprUrl);
            const data = res.data;
            const d = parseTime(data.ts);
            const newData = {};
            newData['name'] = (realAreaName == '') ? area.name : realAreaName;
            newData['time'] = `${d.year}/${d.month}/${d.day} ${d.hour}:${d.minute}`;
            newData['rain'] = data.rain == undefined ? 0 : (data.rain["3h"] / 3).toFixed(2);
            newData['temp'] = data.main.temp;
            newData['rh'] = data.main.humidity;
            newData['ws'] = data.wind.speed;
            newData['feel'] = Math.round(1.07 * newData['temp'] +
                0.2 * newData['rh'] / 100 * 6.105 *
                Math.pow(2.71828, (17.27 * newData['temp'] / (237.7 + newData['temp']))) -
                0.65 * newData['ws'] - 2.7);
            newData['wd'] = newData['ws'] == 0 ? '-' : parseWindDirection(data.wind.deg);
            newData['pres'] = data.main.pressure;
            replyMsg = require('../message/parseAreaWeatherMsg')(newData);
        } catch (e) {
            console.log(e)
            replyMsg = `查不到此地區天氣資料`;
        }
    } catch (err) {
        console.log(err);
        replyMsg = '找不到這個地區，請再試一次，或試著把地區放大、輸入更完整的名稱。例如有時候「花蓮」會找不到，但「花蓮縣」就可以。';
    }

    return replyMsg;
}

module.exports.getAreaWeather = getAreaWeather;