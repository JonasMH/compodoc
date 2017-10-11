import * as _ from 'lodash';
const apis = require('../data/api-list.json');

export function finderInAngularAPIs(type: string) {
    let _result = {
        source: 'external',
        data: null
    };

    _.forEach(apis, (angularModuleAPIs: any, angularModule) => {
        let i = 0;
        let len = angularModuleAPIs.length;
        for (i; i<len; i++) {
            if (angularModuleAPIs[i].title === type) {
                _result.data = angularModuleAPIs[i];
            }
        }
    });

    return _result;
}
