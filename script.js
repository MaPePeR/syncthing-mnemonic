// jscs:disable maximumLineLength, disallowMultipleVarDecl, requireSpaceAfterLineComment

var base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
var base32map = {};
(function init() {
    'use strict';
    var i;
    for (i = base32chars.length - 1; i >= 0; i -= 1) {
        base32map[base32chars[i]] = i;
    }
}());

//P56IOI-7MZJNU-2IQGDR-EYDM2M-GTMGL3-BXNPQ6-W5BTBB-Z4TJXZ-WICQ
//P56IOI7-MZJNU2Y-IQGDREY-DM2MGTI-MGL3BXN-PQ6W5BM-TBBZ4TJ-XZWICQ2
//aaaaaaa-aaaaaaA-bbbbbbb-bbbbbbB-ccccccc-ccccccC-ddddddd-ddddddD
var longDeviceIdPattern = /^[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}-[A-Z2-7]{7}$/;
var shortDeviceIdPattern = /^[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{6}-[A-Z2-7]{4}$/;
var unifiedDeviceIdPattern = /^[A-Z2-7]{52}$/;
function unifyDeviceId(id) {
    'use strict';
    if (id.length === 63 && id.match(longDeviceIdPattern)) {
        //New Device id
        id = id.substring(0, 14) + id.substring(16, 30) + id.substring(31, 46) + id.substring(47, 62);
        id = id.replace(/-/g, '');
    } else if (id.length === 60 && id.match(shortDeviceIdPattern)) {
        id = id.replace(/-/g, '');
    } else {
        throw 'Cannot parse DeviceID!';
    }
    return id;
}

function isUnifiedId(id) {
    'use strict';
    return id.match(unifiedDeviceIdPattern);
}

function testUnifyDeviceId() {
    'use strict';
    var i, result, tests = [
        ['P56IOI7-MZJNU2Y-IQGDREY-DM2MGTI-MGL3BXN-PQ6W5BM-TBBZ4TJ-XZWICQ2', 'P56IOI7MZJNU2IQGDREYDM2MGTMGL3BXNPQ6W5BTBBZ4TJXZWICQ'],
        ['P56IOI-7MZJNU-2IQGDR-EYDM2M-GTMGL3-BXNPQ6-W5BTBB-Z4TJXZ-WICQ', 'P56IOI7MZJNU2IQGDREYDM2MGTMGL3BXNPQ6W5BTBBZ4TJXZWICQ']
    ];
    for (i = 0; i < tests.length; i += 1) {
        result = unifyDeviceId(tests[i][0]);
        if (!isUnifiedId(result)) {
            throw 'Testcase-Fail for unifyDeviceId: Returned non-unified Id';
        }
        if (result !== tests[i][1]) {
            throw 'Testcase-Fail for unifyDeviceId: ' + tests[i][0] + ':\n' + result + ' !=\n' + tests[i][1];
        }
    }
    console.log('testUnifyDeviceId passed');
}

function checkUnifiedId(unifiedId) {
    'use strict';
    if (!isUnifiedId(unifiedId)) {
        throw unifiedId + 'Is not a unified Id';
    }
}

function unifiedToOldFormat(unifiedId) {
    'use strict';
    checkUnifiedId(unifiedId);
    var out = '', sum = 0, i, oldFormatGroups = [6, 6, 6, 6, 6, 6, 6, 6, 4];
    for (i = 0; i < oldFormatGroups.length - 1; i += 1) {
        out += unifiedId.substring(sum, sum + oldFormatGroups[i]) + '-';
        sum += oldFormatGroups[i];
    }
    return out + unifiedId.substring(sum, sum + oldFormatGroups[oldFormatGroups.length - 1]);
}

function testUnifiedToOldFormat() {
    'use strict';
    var oldformat = 'P56IOI-7MZJNU-2IQGDR-EYDM2M-GTMGL3-BXNPQ6-W5BTBB-Z4TJXZ-WICQ';
    var unifiedId = unifyDeviceId(oldformat);
    var result = unifiedToOldFormat(unifiedId);
    if (result !== oldformat) {
        throw 'Testcase-Fail for unifiedToOldFormat: got \'' + result + '\' expected \'' + oldformat + '\'';
    }
    console.log('testUnifiedToOldFormat passed');
}

function getBitFromBase32(unifiedId, n) {
    'use strict';
    return getBit(n, 5, function getGroupFromBase32String(whichGroup) {
        return base32map[unifiedId[whichGroup] || 'A'];
    });
}

function getBit(n, groupsize, getGroup) {
    'use strict';
    var whichGroup = Math.floor(n / groupsize), group = getGroup(whichGroup);
    //console.log('getBit(' + n + ', ' + groupsize +'). CharId = ' + whichGroup + ' group = ' + group);
    //Shift group to the right, so the interesting bit is at the rightmost postion
    group = (group >> (groupsize - 1 - (n % groupsize)));
    return (group & 1) > 0;
}

function testGetBitFromBase32() {
    'use strict';
    var i, j, result, tests = [
        ['7A7A', [true, true, true, true, true, false, false, false, false, false, true, true, true, true, true, false, false, false, false, false]],
        ['B', [false, false, false, false, true]],
        //Return false for every bit after the last one
        ['C', [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]]
    ];
    for (i = 0; i < tests.length; i += 1) {
        for (j = 0; j < tests[i][1].length; j += 1) {
            result = getBitFromBase32(tests[i][0], j);
            if (result !== tests[i][1][j]) {
                throw 'Testcase-Fail for getBitFromBase32(' + tests[i][0] + ', ' + j + '): got \'' + result + '\' expected \'' + tests[i][1][j] + '\'';
            }
        }
    }
    console.log('testGetBitFromBase32 passed');
}

function regroupBits(oldgroupsize, newgroupsize, oldgroupcount, getGroup, appendGroup) {
    'use strict';
    if (oldgroupcount * oldgroupsize % newgroupsize !== 0) {
        throw 'Cannot group ' + oldgroupcount + ' * ' + oldgroupsize + ' into groups of ' + newgroupsize;
    }
    return regroupBitsWithZeroPadding(oldgroupsize, newgroupsize, oldgroupcount, oldgroupcount * oldgroupsize / newgroupsize,  getGroup, appendGroup);
}

function regroupBitsWithZeroPadding(oldgroupsize, newgroupsize, oldgroupcount, newgroupcount, getGroup, appendGroup) {
    'use strict';
    var i, j, outgroups, group;
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

function appendOrCreateGroupList(oldGroups, group) {
    'use strict';
    if (oldGroups === undefined) {
        return [group];
    } else {
        oldGroups.push(group);
        return oldGroups;
    }
}

function makeGetGroupForBrackets(groups) {
    'use strict';
    return function (whichGroup) {
        return groups[whichGroup];
    };
}

function makeGetGroupForBase32(base64) {
    'use strict';
    return function getGroupFromBase32String(whichGroup) {
        return base32map[base64[whichGroup] || 'A'];
    };
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

    var i, getGroup, result, tests = [
        {in: [0xA, 0xB, 0xC, 0xD], expected: [0xAB, 0xCD], gsize: 4, ngsize: 8},
        {in: [0xC, 0x0, 0xF, 0xF], expected: [0xC0, 0xFF], gsize: 4, ngsize: 8},
        {in: [0xC, 0x0], expected: [0xC0], gsize: 4, ngsize: 8},
        {in: [0xABCD, 0xEF01], expected: [0xAB, 0xCD, 0xEF, 0x01], gsize: 4 * 4, ngsize: 2 * 4},
    ];
    for (i = 0; i < tests.length; i += 1) {
        getGroup = makeGetGroupForBrackets(tests[i].in);
        result = regroupBits(tests[i].gsize, tests[i].ngsize, tests[i].in.length, getGroup, appendOrCreateGroupList);
        if (!arrayEquals(result, tests[i].expected)) {
            throw 'Testcase-Fail for regroupBits(' + tests[i].gsize + ', ' + tests[i].ngsize + ', ' + tests[i].in.length + '): got \'' + result + '\' expected \'' + tests[i].expected + '\'';
        }
    }
    console.log('testRegroupBitsWithHex passed');
}

function deviceIdToBitGroups(unifiedId) {
    'use strict';
    checkUnifiedId(unifiedId);
    //Group DeviceID to 8-bit groups, so we can calculate an additonal checksum byte.
    var i, sum = 0, byteGroups = regroupBitsWithZeroPadding(5, 8, unifiedId.length, 256 / 8, makeGetGroupForBase32(unifiedId), appendOrCreateGroupList);
    for (i = 0; i < byteGroups.length; i += 1) {
        sum = (sum + byteGroups[i]) & 0xFF;
    }
    byteGroups.push(sum);
    //byteGroups now has 256 + 8 = 264 = 11 * 24 bits
    return regroupBits(8, 11, byteGroups.length, makeGetGroupForBrackets(byteGroups), appendOrCreateGroupList);
}

function bitGroupsToDeviceId(groups) {
    'use strict';
    function appendWithBase32Char(oldGroups, group) {
        if (oldGroups === undefined) {
            return base32chars[group];
        } else {
            return oldGroups + base32chars[group];
        }
    }
    var i, sum = 0, groupOf8 = regroupBits(11, 8, groups.length, makeGetGroupForBrackets(groups), appendOrCreateGroupList);
    for (i = 0; i < groupOf8.length - 1; i += 1) {
        sum = (sum + groupOf8[i]) & 0xFF;
    }
    if (sum !== groupOf8[groupOf8.length - 1]) {
        throw 'Checksum did not match!';
    }
    groupOf8[groupOf8.length - 1] = 0;
    return regroupBitsWithZeroPadding(8, 5, groupOf8.length - 1, Math.ceil(256 / 5), makeGetGroupForBrackets(groupOf8), appendWithBase32Char);
}

function testForwardBackwordsConversion() {
    'use strict';
    var i, unifiedId, bitGroups, result, deviceIds = ['P56IOI-7MZJNU-2IQGDR-EYDM2M-GTMGL3-BXNPQ6-W5BTBB-Z4TJXZ-WICQ', 'P56IOI7-MZJNU2Y-IQGDREY-DM2MGTI-MGL3BXN-PQ6W5BM-TBBZ4TJ-XZWICQ2'];
    for (i = 0; i < deviceIds.length; i += 1) {
        unifiedId = unifyDeviceId(deviceIds[i]);
        bitGroups = deviceIdToBitGroups(unifiedId);
        result = bitGroupsToDeviceId(bitGroups);
        if (result !== unifiedId) {
            throw 'Testcase-Fail: Forward-BackwardsConversion did not result in original unified ID. Got ' + result + ' expected: ' + unifiedId;
        }
    }
    console.log('testForwardBackwordsConversion passed');
}

var executeTests = false;
if (executeTests) {
    testUnifyDeviceId();
    testGetBitFromBase32();
    testRegroupBitsWithHex();
    testForwardBackwordsConversion();
    testUnifiedToOldFormat();
}
