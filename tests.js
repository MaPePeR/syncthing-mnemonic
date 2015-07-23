var differentDeviceIdFormats = [
    'P56IOI-7MZJNU-2IQGDR-EYDM2M-GTMGL3-BXNPQ6-W5BTBB-Z4TJXZ-WICQ',
    'P56IOI-7MZJNU2Y-IQGDR-EYDM2M-GTI-MGL3-BXNPQ6-W5BM-TBB-Z4TJXZ-WICQ2',
    'P56IOI7 MZJNU2I QGDREYD M2MGTMGL 3BXNPQ6W 5BTB BZ4T JXZWICQ',
    'P56IOI7 MZJNU2Y IQGDREY DM2MGTI MGL3BXN PQ6W5BM TBBZ4TJ XZWICQ2',
    'P56IOI7MZJNU2IQGDREYDM2MGTMGL3BXNPQ6W5BTBBZ4TJXZWICQ',
    'p56ioi7mzjnu2iqgdreydm2mgtmgl3bxnpq6w5btbbz4tjxzwicq',
    'P56IOI7MZJNU2YIQGDREYDM2MGTIMGL3BXNPQ6W5BMTBBZ4TJXZWICQ2',
    'P561017MZJNU2YIQGDREYDM2MGTIMGL3BXNPQ6W5BMT88Z4TJXZWICQ2',
    'p56ioi7mzjnu2yiqgdreydm2mgtimgl3bxnpq6w5bmtbbz4tjxzwicq2',
    'p561017mzjnu2yiqgdreydm2mgtimgl3bxnpq6w5bmt88z4tjxzwicq2'];

function testUnifyDeviceId() {
    'use strict';
    //Testcases from https://github.com/syncthing/protocol/blob/d84a8e64043f8d6c41cc8d6b7d5ab31c0a25b4c2/deviceid_test.go#L7-L19
    var i, result, tests = differentDeviceIdFormats,
         unified = 'P56IOI7MZJNU2IQGDREYDM2MGTMGL3BXNPQ6W5BTBBZ4TJXZWICQ';
    for (i = 0; i < tests.length; i += 1) {
        result = unifyDeviceId(tests[i]);
        if (!isUnifiedId(result)) {
            throw 'Testcase-Fail for unifyDeviceId: Returned non-unified Id';
        }
        if (result !== unified) {
            throw 'Testcase-Fail for unifyDeviceId: ' + tests[i] + ' result: \n' + result + ' !=\n' + unified;
        }
    }
    console.log('testUnifyDeviceId passed');
}

function testChecksumErrorInNewDeviceId() {
    'use strict';
    var id;
    try {
        for (id in differentDeviceIdFormats) {
            unifyDeviceId(id.replace(/2$/,5));
            unifyDeviceId(id.replace(/^P/,'E'));
            unifyDeviceId(id.replace('GTI','AE1'));
        }
    } catch (e) {
        console.log('testChecksumErrorInNewDeviceId passed');
        return;
    }
    throw "Testcase-Fail for testChecksumErrorInNewDeviceId: did not throw an exception on checksum-error";
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

function testUnifiedToNewFormat() {
    var i, id, expected = 'P56IOI7-MZJNU2Y-IQGDREY-DM2MGTI-MGL3BXN-PQ6W5BM-TBBZ4TJ-XZWICQ2', result;
    for (i = 0; i < differentDeviceIdFormats.length; i += 1) {
        id = differentDeviceIdFormats[i];
        result = unifiedToNewFormat(unifyDeviceId(id));
        if (result !== expected) {
            throw 'Testcase-Fail for testUnifiedToNewFormat: got \'' + result + '\' expected \'' + expected + '\'';
        }
    }
    console.log('testUnifiedToNewFormat passed')
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

testUnifyDeviceId();
testGetBitFromBase32();
testRegroupBitsWithHex();
testForwardBackwordsConversion();
testUnifiedToOldFormat();
testChecksumErrorInNewDeviceId();
testUnifiedToNewFormat();
