(function($) {
    var TdGal = function(config) {
        this._config = {
            container: null,
            classes: null,
            onClick: null,
            onFocus: null,
            onInit: null,
            backTemplate: function() {
                return "";
            },
            heightRatio: 1
        };
        $.extend(this._config, config);
        if (this._config.container === null || this._config.container.size() <= 0) {
            throw new Error("Element not found");
        }
        var self = this;
        /**
        * Space between gallery element
        * default 75% of elements width
        */
        this.SPACE_BETWEEN_ELEMENTS = .75;
        /**
        * Adjust space between camera and focused element
        * X % of the element width
        */
        this.FOCUS_TRANSLATION = 1;
        this.FONT_RATIO = 22;
        this.TEMPLATE = '<div class="tdvp">' + '<div class="template-element">' + '<div class="front applyHeight">' + '<div class="image"></div>' + '<div class="applyHeight">' + '<div class="mirror"></div>' + '<div class="shadow"></div>' + "</div>" + "</div>" + '<div class="back applyFont applyHeight"></div>' + "</div>" + "</div>" + '<div class="tdlabel">' + '<div class="label-overflow"></div>' + "</div>";
        this._original = this._config.container;
        this._templateElement = null;
        this._vp = null;
        this._cont = null;
        this._build();
        this._heightRatio = this._config.heightRatio;
        this._clabel = this._cont.find(".tdlabel");
        this._labelOverflow = this._clabel.find(".label-overflow");
        this._elements = this._vp.find(".element");
        this._elemWidth = null;
        this._contWidth = null;
        this._circleStep = null;
        this._radius = null;
        this._nElem = null;
        var debounce = null;
        $(window).on("resize.tdGal", function() {
            if (debounce) {
                clearTimeout(debounce);
            }
            //pour pas spam le navigateur je debounce a 200ms
            debounce = setTimeout(function() {
                self._onWinResize();
            }, 200);
        });
        this._setDefaultFocus();
        this._compileLabels();
        this.update();
        if (this._config.onInit) {
            window.setTimeout(function() {
                self._config.onInit();
            });
        }
    };
    TdGal.prototype._build = function() {
        //récup les data déjà déf
        var data = [];
        this._original.find("li").each(function() {
            var $el = $(this);
            var $a = $el.find("a");
            var link = $a.attr("href");
            if (link.toLowerCase() === "javascript:" || link === "#") link = null;
            var elData = {
                link: link,
                image: $el.find("img").attr("src"),
                label: $a.attr("title") || $el.data("label")
            };
            $.extend(elData, $el.data("properties"));
            data.push(elData);
        });
        var $template = $(this.TEMPLATE);
        this._templateElement = $template.find(".template-element");
        this._cont = $("<div />").attr("class", this._config.classes).addClass("tdgal").html($template);
        //backup original contents
        var contents = this._original.contents();
        this._original.html(this._cont);
        this._original = contents;
        this._vp = this._cont.find(".tdvp:first-child");
        for (var i = 0; i < data.length; i++) {
            this._updateElement(data[i]);
        }
    };
    /**
    * Add // update an element to the gallery
    */
    TdGal.prototype._updateElement = function(data, $el) {
        if (!$el) {
            $el = this._templateElement.clone();
            var self = this;
            $el.on("click.tdGal", function() {
                self._onElementClick($(this));
            });
            this._vp.append($el);
        }
        $el.find(".mirror,.image").css({
            "background-image": "url(" + data.image + ")"
        });
        if (data.link) {
            $el.addClass("link");
        } else {
            $el.removeClass("link");
        }
        //recreate backface template
        $el.find(".back").html(this._config.backTemplate(data));
        $el.data("data", data).removeClass("template-element").addClass("element");
    };
    TdGal.prototype._setDefaultFocus = function() {
        if (this._vp.find(".element.focus").size() <= 0) {
            this._elements.eq(0).addClass("focus");
        }
    };
    /**
    * Définit les elements de la gallery
    */
    TdGal.prototype.setElements = function(data) {
        var nElems = data.length;
        //add or update existing elements
        for (var i = 0; i < nElems; i++) {
            var $el = this._elements.eq(i);
            this._updateElement(data[i], $el.size() ? $el : null);
        }
        //delete others 
        for (var i = nElems; i < this._nElem; i++) {
            this._elements.eq(i).remove();
        }
        this._elements = this._vp.find(".element");
        this._setDefaultFocus();
        this._compileLabels();
        this.update();
    };
    /**
    * Update sizes used for calculate gallery circle
    */
    TdGal.prototype._updateSizes = function() {
        this._elemWidth = this._elements.first().width();
        this._contWidth = this._cont.width();
        //recalculate height
        var elHeight = this._elemWidth * this._heightRatio;
        this._elements.height(elHeight).find(".applyHeight").height(elHeight);
        this._elements.find(".applyFont").css({
            "font-size": Math.round(this._elemWidth / this.FONT_RATIO) + "px"
        });
        this._cont.height(elHeight + this._clabel.outerHeight(true));
        this._nElem = this._elements.size();
        //quand on a que 2 elements, on se retrouve forcement avec le 2eme derrière le 1er 
        var nVirtualElem = this._nElem <= 2 ? 3 : this._nElem;
        //calcul le radius parfait pour que nos elements se rejoinent
        var perfectRadius = Math.round(this._elemWidth / 2 / Math.tan(Math.PI / nVirtualElem));
        //calcul le nombre d'elements qu'on peut rentrer a l'écran
        var displayable = Math.floor(this._contWidth / this._elemWidth);
        //calcul du radius pour afficher un max d'elements a l'écran
        this._radius = Math.round(displayable * this._elemWidth * this.SPACE_BETWEEN_ELEMENTS / 2 / //(this._elemWidth * this.SPACE_BETWEEN_ELEMENTS / 2) /
        Math.tan(Math.PI / nVirtualElem));
        //réajuste la step en fonction du ratio radius parfait / radius affichable
        this._circleStep = perfectRadius / this._radius * (360 / nVirtualElem);
        //on va maintenant réajuster les labels en fonction du container width
        var $labels = this._labelOverflow.find(".text");
        $labels.width(this._contWidth);
        this._labelOverflow.width($labels.size() * this._contWidth);
    };
    /**
    * Recalculate positions in circle
    */
    TdGal.prototype._calculate = function() {
        var maxRadius = this._radius + this._elemWidth * this.FOCUS_TRANSLATION;
        this._vp.css({
            transform: "translateZ(-" + maxRadius + "px) translateX(" + (this._contWidth / 2 - this._elemWidth / 2) + "px)"
        });
        var focusOffset = 0;
        //Math.floor(this._nElem / 2);
        for (var i = 0; i < this._nElem; i++) {
            if (this._elements.eq(i).hasClass("focus")) {
                focusOffset = i;
                break;
            }
        }
        for (var i = 0; i < focusOffset; i++) {
            this._elements.eq(i).css({
                transform: "rotateY(-" + this._circleStep * (focusOffset - i) + "deg) translateZ(" + this._radius + "px) rotateY(60deg)"
            });
        }
        this._elements.eq(focusOffset).css({
            transform: "rotateY(0deg) translateZ(" + maxRadius + "px)"
        });
        for (var i = focusOffset + 1; i < this._nElem; i++) {
            this._elements.eq(i).css({
                transform: "rotateY(" + this._circleStep * (i - focusOffset) + "deg) translateZ(" + this._radius + "px) rotateY(-60deg)"
            });
        }
    };
    /**
    * Update gallery positions
    */
    TdGal.prototype.update = function() {
        this._updateSizes();
        this._calculate();
    };
    TdGal.prototype._compileLabels = function() {
        var $labels = this._clabel.find(".text");
        var nLabels = $labels.size() - 1;
        var nElem = this._elements.size();
        //ajoute les labels manquants || update les existants
        for (var i = 0; i < nElem; i++) {
            var label = null;
            if (i > nLabels) {
                label = $('<div class="text" />');
                this._labelOverflow.append(label);
            } else {
                label = $labels.eq(i);
            }
            var labelText = this._elements.eq(i).data("data")["label"];
            if (!labelText || labelText.length <= 0) {
                label.html("&nbsp;");
            } else {
                label.text(labelText);
            }
        }
        //supprime le rab
        for (var i = nElem; i <= nLabels; i++) {
            $labels.eq(i).remove();
        }
    };
    TdGal.prototype._displayTag = function(offset) {
        this._labelOverflow.css({
            transform: "translateX(-" + this._contWidth * offset + "px)"
        });
    };
    /**
    * Lorsqu'on clique sur l'element
    */
    TdGal.prototype._onElementClick = function(el) {
        var data = el.data("data");
        if (el.hasClass("focus")) {
            if (this._config.onClick && data.link) {
                this._config.onClick(data, this._elements.index(el));
            }
            return;
        }
        this._elements.removeClass("focus");
        el.addClass("focus");
        this._calculate();
        var offset = this._elements.index(el);
        this._displayTag(offset);
        if (this._config.onFocus) {
            this._config.onFocus(data, offset);
        }
    };
    /**
     * Display next element
     */
    TdGal.prototype.next = function() {
        var $focus = this._vp.find(".focus");
        var $next = $focus.next(".element");
        if ($next.size() > 0) {
            this._onElementClick($next);
        } else {
            this._onElementClick(this._elements.first());
        }
    };
    /**
     * Display previous element
     */
    TdGal.prototype.prev = function() {
        var $focus = this._vp.find(".focus");
        var $prev = $focus.prev(".element");
        if ($prev.size() > 0) {
            this._onElementClick($prev);
        } else {
            this._onElementClick(this._elements.last());
        }
    };
    /**
     * Set focus
     * @param int offset Element offset
     */
    TdGal.prototype.focus = function(offset) {
        if (offset >= this._nElem) {
            offset = 0;
        } else if (offset < 0) {
            offset = this._nElem - 1;
        }
        this._onElementClick(this._elements.eq(offset));
    };
    /**
      * Get elements count
      */
    TdGal.prototype.count = function() {
        return this._nElem;
    };
    /**
    * Destroy the gallery
    */
    TdGal.prototype.destroy = function() {
        this._elements.off("click.tdGal");
        this._cont.replaceWith(this._original);
        this._original = null;
        this._vp = null;
        this._cont = null;
        this._clabel = null;
        this._labelOverflow = null;
        this._elements = null;
        this._templateElement = null;
        this._config = null;
        $(window).off("resize.tdGal");
    };
    TdGal.prototype._onWinResize = function() {
        this._updateSizes();
        this._calculate();
    };
    /**
     * jQuery wrapper
     */
    $.fn.tdGal = function(config, params) {
        //getter
        if (typeof config == "string" && config == "count") {
            var inst = $(this).first().data("__tdgal");
            if (!inst) throw new Error("Tdgal instance not found");
            return inst.count();
        }
        return this.each(function() {
            var $this = $(this);
            var inst = $(this).data("__tdgal");
            //create the gallery
            if (typeof config == "object" || typeof config === "undefined") {
                if (inst) {
                    throw new Error("TdGal already created");
                }
                if (!config) {
                    config = {};
                }
                config.container = $(this);
                $this.data("__tdgal", new TdGal(config));
                return;
            }
            if (typeof config == "string" && inst) {
                switch (config.toLowerCase()) {
                  case "destroy":
                    $this.data("__tdgal", null);
                    inst.destroy();
                    return;

                  case "prev":
                    inst.prev();
                    return;

                  case "next":
                    inst.next();
                    return;

                  case "update":
                    inst.update();
                    return;

                  case "focus":
                    inst.focus(params);
                    return;

                  case "elements":
                    inst.setElements(params);
                    return;

                  default:
                    throw Error("Cannot found method " + config);
                }
            }
            throw new Error("Tdgal instance not found");
        });
    };
})(jQuery);

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
    m.directive("tdGal", [ "$controller", "$compile", "$rootScope", function($controller, $compile, $rootScope) {
        return {
            restrict: "E",
            replace: false,
            scope: {
                data: "=",
                index: "="
            },
            link: function($scope, $elem, $attrs, $ctrl) {
                var templateUrl = $attrs.templateUrl;
                $scope.localIndex = $scope.index;
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
                    onFocus: function(data, index) {
                        $scope.index = $scope.localIndex = index;
                        if (!$scope.$$phase && !$rootScope.$$phase) $scope.$apply();
                        $scope.$emit("tdgal-focus", data);
                    },
                    onInit: function() {
                        if ($scope.index) {
                            $elem.tdGal("focus", $scope.index);
                        }
                    }
                };
                if (!localConf.heightRatio || localConf.heightRatio <= 0) delete localConf.heightRatio;
                if (!localConf.classes || localConf.classes <= 0) delete localConf.classes;
                $elem.tdGal(localConf);
                var offIndexWatch = $scope.$watch("index", function(val) {
                    if ($scope.localIndex != val) {
                        $elem.tdGal("focus", val);
                    }
                });
                var dataWatcher = $scope.$watch("data", function(data) {
                    $elem.tdGal("elements", data);
                });
                $scope.$on("$destroy", function() {
                    $elem.tdGal("destroy");
                    dataWatcher();
                    offIndexWatch();
                });
            }
        };
    } ]);
});