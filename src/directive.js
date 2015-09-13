
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        // CommonJS
        if (typeof angular === 'undefined') {
            module.exports = factory(require('angular'));
        } else {
            module.exports = factory(angular);
        }
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['angular'], factory);
    } else {
        // Global Variables
        factory(root.angular);
    }
}(this, function (angular) {
	var m = angular.module('tdGal', []);
	
	m.directive('tdGalBackface', ['$controller', function(){
		return {
			restrict: 'E',
			templateUrl: function($elem, $attrs){
				return $attrs.templateUrl;
			}
		};
	}]);
	
	m.directive('tdGal', ['$controller', '$compile', '$rootScope', function($controller, $compile, $rootScope){
		return {
			restrict: 'E',
			replace: false,
			scope: {
				data: '=',
				index: '='
			},
			link: function($scope, $elem, $attrs, $ctrl){
				var templateUrl = $attrs.templateUrl;
				$scope.localIndex = $scope.index;
				
				var localConf = {
					heightRatio: $scope.$eval($attrs.heightRatio),
					classes: $attrs.class,
					backTemplate: function(data){
						if(!templateUrl)
							return '';
						
						var el = document.createElement('td-gal-backface');
						el.setAttribute('template-url', templateUrl);
						
						var $childScope = $scope.$new();
						$childScope.data = data;
						
						$compile(el)($childScope);
						return el;
					},
					onClick: function(data){
						$scope.$emit('tdgal-click', data);
					},
					onFocus: function(data, index){
						$scope.index = $scope.localIndex = index;
						
						if(!$scope.$$phase && !$rootScope.$$phase)
							$scope.$apply();
						
						$scope.$emit('tdgal-focus', data);
					},
					onInit: function(){
						if($scope.index){
							$elem.tdGal('focus', $scope.index);
						}
					}
				};
				
				if(!localConf.heightRatio || localConf.heightRatio <= 0)
					delete localConf.heightRatio;
				
				if(!localConf.classes || localConf.classes <= 0)
					delete localConf.classes;	
				
				$elem.tdGal(localConf);	
				
				var offIndexWatch = $scope.$watch('index', function(val){
					if($scope.localIndex != val){
						$elem.tdGal('focus', val);
					}
				});
				
				var dataWatcher = $scope.$watch('data', function(data){
					$elem.tdGal('elements', data);			
				});
				
				$scope.$on('$destroy', function(){
					$elem.tdGal('destroy');	
					dataWatcher();
					offIndexWatch();
				});
			}
		};     
	}]);
}));