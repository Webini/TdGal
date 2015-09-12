(function(root, factory) {
    if (typeof module !== "undefined" && module.exports) {
        // CommonJS
        if (typeof angular === "undefined") {
            module.exports = factory(require("angular"));
        } else {
            module.exports = factory(angular);
        }
    } else if (typeof define === "function" && define.amd) {
        // AMD
        define([ "angular" ], factory);
    } else {
        // Global Variables
        factory(root.angular);
    }
})(this, function(angular) {
    var m = angular.module("tdGal", []);
    m.directive("tdGalBackface", [ "$controller", function() {
        return {
            restrict: "E",
            templateUrl: function($elem, $attrs) {
                return $attrs.templateUrl;
            }
        };
    } ]);
    m.directive("tdGal", [ "$controller", "$compile", function($controller, $compile) {
        return {
            restrict: "E",
            replace: false,
            scope: {
                data: "="
            },
            controller: "@",
            name: "controller",
            link: function($scope, $elem, $attrs, $ctrl) {
                var templateUrl = $attrs.templateUrl;
                var localConf = {
                    heightRatio: $scope.$eval($attrs.heightRatio),
                    classes: $attrs.class,
                    backTemplate: function(data) {
                        if (!templateUrl) return "";
                        var el = document.createElement("td-gal-backface");
                        el.setAttribute("template-url", templateUrl);
                        var $childScope = $scope.$new();
                        $childScope.data = data;
                        $compile(el)($childScope);
                        return el;
                    },
                    onClick: function(data) {
                        $scope.$emit("tdgal-click", data);
                    },
                    onFocus: function(data) {
                        $scope.$emit("tdgal-focus", data);
                    }
                };
                if (!localConf.heightRatio || localConf.heightRatio <= 0) delete localConf.heightRatio;
                if (!localConf.classes || localConf.classes <= 0) delete localConf.classes;
                $elem.tdGal(localConf);
                $scope.next = function() {
                    $elem.tdGal("next");
                };
                $scope.prev = function() {
                    $elem.tdGal("prev");
                };
                $scope.update = function() {
                    $elem.tdGal("update");
                };
                var dataWatcher = $scope.$watch("data", function(data) {
                    $elem.tdGal("elements", data);
                });
                $scope.$on("$destroy", function() {
                    $elem.tdGal("destroy");
                    dataWatcher();
                });
            }
        };
    } ]);
});