#!/usr/bin/env node

var concat = require('concat-stream'),
  opener = require('opener'),
  tty = require('tty'),
  path = require('path'),
  fs = require('fs'),
  wellknown = require('wellknown'),
  argv = require('minimist')(process.argv.slice(2));

((argv._[0] && fs.createReadStream(argv._[0])) || process.stdin).pipe(concat(openData));

function sendData(json) {
  console.log(JSON.stringify(json));
}

function trim (str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

function tryParsingAsFeatures(body) {
  var lines = body.toString().split('\n');
      
  var failed = false;
  var features = [];
  for (var i=0; i < lines.length; i++) {
    var line = trim(lines[i]);
    if (line[line.length - 1] == ',') {
      line = line.slice(0, line.length - 1);
    }
    if (line[0] != '{') {
      // assume it's grep output with the filename included
      line = line.replace(/^[^:]+:/, '');
    }
    if (line == '') {
      continue;
    }
    var json = null;

    json = wellknown(line);

    if (json != null) {
      // work around a bug in wellknown parsing multipolygons with no loops
      if (json['type'] === 'MultiPolygon' &&
        typeof(json['coordinates'][0][0][0]) == typeof(45.0)) {
        console.error('fixing coords on multipolygon')
        json['coordinates'] = [json['coordinates']];
      }
      json = { 'type': 'Feature', 'geometry': json }
    } else {
      try {
        json = JSON.parse(line);
        if (json['type'].match(/^.*(Polygon|LineString|Point)$/)) {
          // Transform geometry into feature
          json = {
            "type": "Feature",
            "geometry": json,
            "properties": {}
          }
        } else if (json['type'] != 'Feature') {
          console.error('Line ' + i + ' did not look like a feature ' + JSON.stringify(json));
          failed = true;
        }
      } catch(e) {
        console.error('Line ' + i + ' could not parse as json: ' + e);
        console.error(line);
        failed = true;
      }
    }

    if (json != null) {
      features.push(json);
    }
  }

  if (!failed) {
    sendData({
      "type": "FeatureCollection",
      "features": features
    })
  } else {
    console.error('Valid GeoJSON file required as input.');
  }
}

function openData(body) {
  try {
    sendData(JSON.parse(body.toString()))
  } catch(e) {
    console.error('Trying to parse as lines of features.');
    tryParsingAsFeatures(body.toString());
  }
}
