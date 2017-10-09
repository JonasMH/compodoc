import * as util from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { logger } from '../logger';

const JSON5 = require('json5');

export class RouterParser {
    public incompleteRoutes: Array<any> = new Array();

    private routes: any[] = [];
    private modules = [];
    private modulesTree;
    private rootModule;
    private cleanModulesTree;
    private modulesWithRoutes = [];


    public addRoute(route) {
        this.routes.push(route);
        this.routes = _.sortBy(_.uniqWith(this.routes, _.isEqual), ['name']);
    }

    public addIncompleteRoute(route) {
        this.incompleteRoutes.push(route);
        this.incompleteRoutes = _.sortBy(_.uniqWith(this.incompleteRoutes, _.isEqual), ['name']);
    }

    public addModuleWithRoutes(moduleName, moduleImports, filename) {
        this.modulesWithRoutes.push({
            name: moduleName,
            importsNode: moduleImports,
            filename: filename
        });
        this.modulesWithRoutes = _.sortBy(_.uniqWith(this.modulesWithRoutes, _.isEqual), ['name']);
    }

    public addModule(moduleName: string, moduleImports) {
        this.modules.push({
            name: moduleName,
            importsNode: moduleImports
        });
        this.modules = _.sortBy(_.uniqWith(this.modules, _.isEqual), ['name']);
    }

    public cleanRawRouteParsed(route: string) {
        let routesWithoutSpaces = route.replace(/ /gm, '');
        let testTrailingComma = routesWithoutSpaces.indexOf('},]');

        if (testTrailingComma !== -1) {
            routesWithoutSpaces = routesWithoutSpaces.replace('},]', '}]');
        }
        return JSON5.parse(routesWithoutSpaces);
    }

    public cleanRawRoute(route: string) {
        let routesWithoutSpaces = route.replace(/ /gm, '');
        let testTrailingComma = routesWithoutSpaces.indexOf('},]');

        if (testTrailingComma !== -1) {
            routesWithoutSpaces = routesWithoutSpaces.replace('},]', '}]');
        }
        return routesWithoutSpaces;
    }

    public setRootModule(module: string): void {
        this.rootModule = module;
    }

    public hasRouterModuleInImports(imports) {
        let result = false;
        let i = 0;
        let len = imports.length;

        for (i; i < len; i++) {
            if (imports[i].name.indexOf('RouterModule.forChild') !== -1 ||
                imports[i].name.indexOf('RouterModule.forRoot') !== -1) {
                result = true;
            }
        }

        return result;
    }

    private fixIncompleteRoutes(miscellaneousVariables) {
        let i = 0;
        let len = this.incompleteRoutes.length;
        let matchingVariables = [];

        // For each incompleteRoute, scan if one misc variable is in code
        // if ok, try recreating complete route
        for (i; i < len; i++) {
            let j = 0;
            let leng = miscellaneousVariables.length;

            for (j; j < leng; j++) {
                if (this.incompleteRoutes[i].data.indexOf(miscellaneousVariables[j].name) !== -1) {
                    console.log('found one misc var inside incompleteRoute');
                    console.log(miscellaneousVariables[j].name);
                    matchingVariables.push(miscellaneousVariables[j]);
                }
            }

            // Clean incompleteRoute
            this.incompleteRoutes[i].data = this.incompleteRoutes[i].data.replace('[', '');
            this.incompleteRoutes[i].data = this.incompleteRoutes[i].data.replace(']', '');
        }
    }

    public linkModulesAndRoutes() {
        let i = 0;
        let len = this.modulesWithRoutes.length;

        for (i; i < len; i++) {
            _.forEach(this.modulesWithRoutes[i].importsNode, (node: any) => {
                if (node.initializer) {
                    if (node.initializer.elements) {
                        _.forEach(node.initializer.elements, (element: any) => {
                            // find element with arguments
                            if (element.arguments) {
                                _.forEach(element.arguments, (argument: any) => {
                                    _.forEach(this.routes, (route: any) => {
                                        if (argument.text &&
                                            route.name === argument.text &&
                                            route.filename === this.modulesWithRoutes[i].filename) {
                                            route.module = this.modulesWithRoutes[i].name;
                                        }
                                    });
                                });
                            }
                        });
                    }
                }
            });
        }
    }

    private foundRouteWithModuleName(moduleName) {
        return _.find(this.routes, { 'module': moduleName });
    }

    private foundLazyModuleWithPath(modulePath) {
        // modulePath is like app/customers/customers.module#CustomersModule
        let split = modulePath.split('#');
        let lazyModulePath = split[0];
        let lazyModuleName = split[1];

        return lazyModuleName;
    }

    public constructRoutesTree() {
        // routes[] contains routes with module link
        // modulesTree contains modules tree
        // make a final routes tree with that
        this.cleanModulesTree = _.cloneDeep(this.modulesTree);

        let modulesCleaner = function (arr) {
            for (let i in arr) {
                if (arr[i].importsNode) {
                    delete arr[i].importsNode;
                }
                if (arr[i].parent) {
                    delete arr[i].parent;
                }
                if (arr[i].children) {
                    modulesCleaner(arr[i].children);
                }
            }
        };

        modulesCleaner(this.cleanModulesTree);

        let routesTree = {
            name: '<root>',
            kind: 'module',
            className: this.rootModule,
            children: []
        };

        let loopModulesParser = (node) => {
            if (node.children && node.children.length > 0) {
                // If module has child modules
                // console.log('   If module has child modules');
                for (let i in node.children) {
                    let route = this.foundRouteWithModuleName(node.children[i].name);
                    if (route && route.data) {
                        route.children = JSON5.parse(route.data);
                        delete route.data;
                        route.kind = 'module';
                        routesTree.children.push(route);
                    }
                    if (node.children[i].children) {
                        loopModulesParser(node.children[i]);
                    }
                }
            } else {
                // else routes are directly inside the module
                // console.log('   else routes are directly inside the root module');
                let rawRoutes = this.foundRouteWithModuleName(node.name);
                if (rawRoutes) {
                    let routes = JSON5.parse(rawRoutes.data);
                    if (routes) {
                        let i = 0;
                        let len = routes.length;
                        for (i; i < len; i++) {
                            let route = routes[i];
                            if (routes[i].component) {
                                routesTree.children.push({
                                    kind: 'component',
                                    component: routes[i].component,
                                    path: routes[i].path
                                });
                            }
                        }
                    }
                }
            }
        };

        let startModule = _.find(this.cleanModulesTree, { 'name': this.rootModule });

        if (startModule) {
            loopModulesParser(startModule);
            // Loop twice for routes with lazy loading
            // loopModulesParser(routesTree);
        }

        let cleanedRoutesTree = null;

        let cleanRoutesTree = (route) => {
            for (let i in route.children) {
                let routes = route.children[i].routes;
            }
            return route;
        };

        cleanedRoutesTree = cleanRoutesTree(routesTree);


        let loopRoutesParser = (route) => {
            if (route.children) {
                for (let i in route.children) {
                    if (route.children[i].loadChildren) {
                        let child = this.foundLazyModuleWithPath(route.children[i].loadChildren);
                        let module = _.find(this.cleanModulesTree, { 'name': child });
                        if (module) {
                            let _rawModule: any = {};
                            _rawModule.kind = 'module';
                            _rawModule.children = [];
                            _rawModule.module = module.name;
                            let loopInside = (mod) => {
                                if (mod.children) {
                                    for (let i in mod.children) {
                                        let route = this.foundRouteWithModuleName(mod.children[i].name);
                                        if (typeof route !== 'undefined') {
                                            if (route.data) {
                                                route.children = JSON5.parse(route.data);
                                                delete route.data;
                                                route.kind = 'module';
                                                _rawModule.children.push(route);
                                            }
                                        }
                                    }
                                }
                            };
                            loopInside(module);

                            route.children[i].children = [];
                            route.children[i].children.push(_rawModule);
                        }
                    }
                    loopRoutesParser(route.children[i]);
                }
            }
        };
        loopRoutesParser(cleanedRoutesTree);

        // console.log('');
        // console.log('  cleanedRoutesTree: ', util.inspect(cleanedRoutesTree, { depth: 10 }));

        return cleanedRoutesTree;
    }

    public constructModulesTree() {
        // console.log('');
        // console.log('constructModulesTree');
        let getNestedChildren = function (arr, parent?) {
            let out = [];
            for (let i in arr) {
                if (arr[i].parent === parent) {
                    let children = getNestedChildren(arr, arr[i].name);
                    if (children.length) {
                        arr[i].children = children;
                    }
                    out.push(arr[i]);
                }
            }
            return out;
        };

        // Scan each module and add parent property
        _.forEach(this.modules, (firstLoopModule) => {
            _.forEach(firstLoopModule.importsNode, (importNode) => {
                _.forEach(this.modules, (module: any) => {
                    if (module.name === importNode.name) {
                        module.parent = firstLoopModule.name;
                    }
                });
            });
        });

        this.modulesTree = getNestedChildren(this.modules);
    }

    public generateRoutesIndex(outputFolder, routes, bars) {
        return new Promise((resolve, reject) => {
            fs.readFile(path.resolve(__dirname + '/../src/templates/partials/routes-index.hbs'), 'utf8', (err, data) => {
                if (err) {
                    reject('Error during routes index generation');
                } else {
                    let template: any = bars.compile(data);
                    let result = template({
                            routes: JSON.stringify(routes)
                        });
                    let testOutputDir = outputFolder.match(process.cwd());
                    if (!testOutputDir) {
                        outputFolder = outputFolder.replace(process.cwd(), '');
                    }
                    fs.outputFile(path.resolve(outputFolder + path.sep + '/js/routes/routes_index.js'), result, function (err) {
                        if (err) {
                            logger.error('Error during routes index file generation ', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        });
    }

    public routesLength(): number {
        let _n = 0;

        let routesParser = function (route) {
            if (typeof route.path !== 'undefined') {
                _n += 1;
            }
            if (route.children) {
                for (let j in route.children) {
                    routesParser(route.children[j]);
                }
            }
        };

        for (let i in this.routes) {
            routesParser(this.routes[i]);
        }

        return _n;
    }

    public printRoutes() {
        console.log('');
        console.log('printRoutes: ');
        console.log(this.routes);
    }

    public printModulesRoutes() {
        console.log('');
        console.log('printModulesRoutes: ');
        console.log(this.modulesWithRoutes);
    }
}