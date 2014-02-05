# geojsonify

Convert lines of geojson features into a geojson collection.

Useful for using grep to manipulate geojson from ogr2ogr

### installation

    npm install -g geojsonify

### suggested usage

    grep -h something *json | geojsonify | geojsonio-cli 
