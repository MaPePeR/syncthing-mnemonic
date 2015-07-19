/* jshint strict: true, curly: true*/

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

function getBitFromBase32(unifiedId, n) {
    'use strict';
    return getBit(n, 5, function getGroupFromBase32String(whichGroup) {
        return base32map[unifiedId[whichGroup] || "A"];
    });
}
function getBit(n, groupsize, getGroup) {
    'use strict';
    var whichGroup = Math.floor(n / groupsize), group = getGroup(whichGroup);
    //console.log("getBit(" + n + ", " + groupsize +"). CharId = " + whichGroup + " group = " + group);
    //Shift group to the right, so the interesting bit is at the rightmost postion
    group = (group >> (groupsize - 1 - (n % groupsize)));
    return (group & 1) > 0;
}

function testGetBitFromBase32() {
    'use strict';
    var i, j, result, tests = [
        ["7A7A", [true, true, true, true, true, false, false, false, false, false, true, true, true, true, true, false, false, false, false, false]],
        ["B", [false, false, false, false, true]],
        //Return false for every bit after the last one
        ["C", [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]]
    ];
    for (i = 0; i < tests.length; i += 1) {
        for (j = 0; j < tests[i][1].length; j += 1) {
            result = getBitFromBase32(tests[i][0], j);
            if (result !== tests[i][1][j]) {
                throw "Testcase-Fail for getBitFromBase32(" + tests[i][0] +", " + j + "): got \'" + result + "\' expected \'" + tests[i][1][j] + "\'";
            }
        }
    }
    console.log("testGetBitFromBase32 passed");
}

function regroupBits(oldgroupsize, newgroupsize, oldgroupcount, getGroup, appendGroup) {
    'use strict';
    if (oldgroupcount * oldgroupsize % newgroupsize !== 0) {
        throw "Cannot group " + oldgroupcount + " * " + oldgroupsize + " into groups of " + newgroupsize;
    }
    var i, j, newgroupcount = oldgroupcount * oldgroupsize / newgroupsize, outgroups, group;
    for (i = 0; i < newgroupcount; i += 1) {
        group = 0;
        for (j = 0; j < newgroupsize; j += 1) {
            if (getBit(i * newgroupsize + j, oldgroupsize, getGroup)) {
                group |= (1 << (newgroupsize - j - 1));
            }
        }
        outgroups = appendGroup(outgroups, group);
    }
    return outgroups;
}

function testRegroupBitsWithHex() {
    'use strict';
    function arrayEquals(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        var i;
        for (i = 0; i < a.length; i += 1) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    function appendGroup(oldGroups, group) {
        if (oldGroups === undefined) {
            return [group];
        } else {
            oldGroups.push(group);
            return oldGroups;
        }
    }
    function makeGetGroup(groups) {
        return function (whichGroup) {
            return groups[whichGroup];
        };
    }
    var i, getGroup, result, tests = [
        {in: [0xA, 0xB, 0xC, 0xD], expected: [0xAB, 0xCD], gsize: 4, ngsize: 8},
        {in: [0xC, 0x0, 0xF, 0xF], expected: [0xC0, 0xFF], gsize: 4, ngsize: 8},
        {in: [0xC, 0x0], expected: [0xC0], gsize: 4, ngsize: 8},
        {in: [0xABCD, 0xEF01], expected: [0xAB, 0xCD, 0xEF, 0x01], gsize: 4*4, ngsize: 2*4},
    ];
    for (i = 0; i < tests.length; i += 1) {
        getGroup = makeGetGroup(tests[i].in);
        result = regroupBits(tests[i].gsize, tests[i].ngsize, tests[i].in.length, getGroup, appendGroup);
        if (!arrayEquals(result, tests[i].expected)) {
            throw "Testcase-Fail for regroupBits(" + tests[i].gsize + ", " + tests[i].ngsize + ", " + tests[i].in.length + "): got \'" + result + "\' expected \'" + tests[i].expected + "\'";
        }
    }
    console.log("testRegroupBitsWithHex passed");
}
testUnifyDeviceId();
testGetBitFromBase32();
testRegroupBitsWithHex();
