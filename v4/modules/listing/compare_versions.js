var unique = require('array-unique').immutable;
var logger = require(__base);

module.exports = function (req, res) {

    (async function () {
        var jsonArray;
        if (req.body && req.body.versions) {
            try {
                jsonArray = req.body.versions
                if (typeof (jsonArray) === "string")
                    jsonArray = JSON.parse(jsonArray)
            } catch (exception) {
                logger.fileLogger.error(exception);
                logger.myEmitter.emit(`responseTime${req.id}`, new Date());

                res.send({"status_code": 500, "error": "Please Check versions Array"})
                return null
            }
        }


        if (!jsonArray || jsonArray.length < 2) {
            logger.myEmitter.emit(`responseTime${req.id}`, new Date());
            res.send({"status_code": 500, "error": "versions Array length should contain more than one object"})
            return null;
        }


        startMatchProcess(jsonArray)
        function startMatchProcess(jsonArray) {

            var finalVersionChanges = {};
            if (jsonArray.length === 0 || jsonArray.length === 1) {
                logger.fileLogger.error("input object length should contain more than one object");
                logger.myEmitter.emit(`responseTime${req.id}`, new Date());
                res.send({"status_code": 500, "error": "input object length should contain more than one object"})
            } else {

                var uniqueKeysFromArray = getUniqueKeysFromArray(jsonArray)
                for (key in uniqueKeysFromArray) {
                    var changedValue = false;
                    var uniqueKey = uniqueKeysFromArray[key]

                    var firstVersionValue = jsonArray[0][uniqueKeysFromArray[key]]
                    if (firstVersionValue)
                        firstVersionValue = JSON.stringify(firstVersionValue)
                    var eachVersionElementValues = []
                    for (version in jsonArray) {
                        var versionObj = jsonArray[version];
                        var nextVersionValue = versionObj[uniqueKey];
                        if (nextVersionValue)
                            nextVersionValue = JSON.stringify(nextVersionValue);
                        if (nextVersionValue != firstVersionValue) {
                            changedValue = true;
                        }
                        var versionValueKey = "v" + version;
                        var versionKeyValueObj = {};
                        versionKeyValueObj[versionValueKey] = versionObj[uniqueKey];
                        if ((versionObj[uniqueKey]).toString())
                            eachVersionElementValues.push(versionKeyValueObj);
                    }
                    ;
                    if (changedValue) {
                        finalVersionChanges[uniqueKey] = eachVersionElementValues;
                    }
                    ;
                }
                logger.myEmitter.emit(`responseTime${req.id}`, new Date());
                res.send({"status_code": 200, changesElements: finalVersionChanges});

            }


        }



        function getUniqueKeysFromArray(getUniqueKeysFromArray) {
            var uniqueKeys = [];
            for (obj in getUniqueKeysFromArray) {
                uniqueKeys = uniqueKeys.concat(Object.keys(getUniqueKeysFromArray[obj]))
            }
//      console.log("unique ",unique)
            uniqueKeys = unique(uniqueKeys)
            return uniqueKeys
        }

    })();
};





 