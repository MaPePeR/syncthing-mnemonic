var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
var base32map = {};
(function init() {
    "use strict";
    var i;
    for (i = base32chars.length - 1; i >= 0; i -= 1) {
        base32map[base32chars[i]] = i;
    }
}());


//P56IOI-7MZJNU-2IQGDR-EYDM2M-GTMGL3-BXNPQ6-W5BTBB-Z4TJXZ-WICQ
//P56IOI7-MZJNU2Y-IQGDREY-DM2MGTI-MGL3BXN-PQ6W5BM-TBBZ4TJ-XZWICQ2
//aaaaaaa-aaaaaaA-bbbbbbb-bbbbbbB-ccccccc-ccccccC-ddddddd-ddddddD
var longDeviceIdPattern = /[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}/;
var shortDeviceIdPattern = /[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{4}/;
function unifyDeviceId(id) {
    'use strict';
    if (id.length === 63 && id.match(longDeviceIdPattern)) {
        //New Device id
        id = id.substring(0, 14) + id.substring(16, 30) + id.substring(31, 46) + id.substring(47, 62);
        id = id.replace(/-/g, "");
    } else if (id.length === 60 && id.match(shortDeviceIdPattern)) {
        id = id.replace(/-/g, "");
    } else {
        throw "Illegal DeviceID!";
    }
    return id;
}

function testUnifyDeviceId() {
    'use strict';
    var i, result, tests = [
        ["P56IOI7-MZJNU2Y-IQGDREY-DM2MGTI-MGL3BXN-PQ6W5BM-TBBZ4TJ-XZWICQ2", "P56IOI7MZJNU2IQGDREYDM2MGTMGL3BXNPQ6W5BTBBZ4TJXZWICQ"],
        ["P56IOI-7MZJNU-2IQGDR-EYDM2M-GTMGL3-BXNPQ6-W5BTBB-Z4TJXZ-WICQ", "P56IOI7MZJNU2IQGDREYDM2MGTMGL3BXNPQ6W5BTBBZ4TJXZWICQ"]
    ];
    for (i = 0; i < tests.length; i += 1) {
        result = unifyDeviceId(tests[i][0]);
        if (result !== tests[i][1]) {
            throw "Testcase-Fail for " + tests[i][0] + ":\n" + result + " !=\n" + tests[i][1];
        }
    }
    console.log("testUnifyDeviceId passed");
}

function getBit(unifiedId, n) {
    'use strict';
    var whichCharacter = Math.floor(n / 5), chr = base32map[unifiedId[whichCharacter] || "A"];
    //console.log("getBit("+unifiedId + ", "+ n + "). CharId = " + whichCharacter +" chr = " + chr);
    //Shift chr to the right, so the interesting bit is at the rightmost postion
    chr = (chr >> (4 - (n % 5)));
    return (chr & 1) > 0;
}

function testGetBit() {
    'use strict';
    var i, j, result, tests = [
        ["7A7A", [true, true, true, true, true, false, false, false, false, false, true, true, true, true, true, false, false, false, false, false]],
        ["B", [false, false, false, false, true]],
        //Return false for every bit after the last one
        ["C", [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]]
    ];
    for (i = 0; i < tests.length; i += 1) {
        for (j = 0; j < tests[i][1].length; j += 1) {
            result = getBit(tests[i][0], j);
            if (result !== tests[i][1][j]) {
                throw "Testcase-Fail for getBit(" + tests[i][0] +", " + j + "): got \'" + result + "\' expected \'" + tests[i][1][j] + "\'";
            }
        }
    }
    console.log("testGetBit passed");
}

function unifiedIdToWordIds(unifiedId) {
    'use strict';
    if (!unifiedId.match(/^[A-Z2-7]{52}$/)) {
        throw "Not a unified DeviceID";
    }
    var out = new Array(24), dataI = 0, outI = 0, space = 11, left, right;
    for (dataI = 0; dataI < s.length; dataI += 1) {
        if (space >= 5) {
            //5 bits from dataI still fit into outI
            space -= 5;
            out[outI] = out[outI] | (base32map[unifiedId[dataI]] << space);
        } else {
            //Splitting the 5 bits into 2 parts.
            left = (base32map[unifiedId[dataI]] >> (5 - space));
            out[outI] = out[outI] | left;
            outI += 1;
            right = (base32map[unifiedId[dataI]] & (31 >> space));
            space = 11 - (5 - space);
            out[outI] = right << space;
        }
    }
    return out;
}

testUnifyDeviceId();
testGetBit();
