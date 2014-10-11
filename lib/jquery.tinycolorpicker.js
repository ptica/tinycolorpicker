;(function (factory)
{
    if (typeof define === 'function' && define.amd)
    {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object')
    {
        // Node/CommonJS
        factory(require('jquery'));
    } else
    {
        // Browser globals
        factory(jQuery);
    }
}(function ($)
{
    var pluginName = "tinycolorpicker"
    ,   defaults   =
        {
            colors : ["#ffffff", "#A7194B","#FE2712","#FB9902","#FABC02","#FEFE33","#D0EA2B","#66B032","#0391CE","#0247FE","#3D01A5","#8601AF"]
        ,   backgroundUrl : null
        ,   remover: null
        }
    ;

    function Plugin($container, options)
    {
        this.options   = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name     = pluginName;

        var $colorInput = $container;
        $colorInput.get(0).type = 'hidden';
        $container.wrap('<div class="colorpicker tinycolorpicker"/>');
        $container = $container.parent();
        if (this.options.remover) {
            var $remover = $('<a/>', {'class':'remover'}).text(this.options.remover);
            $container.prepend($remover);
        }

        var $track = $('<div class="track"></div>');
        var $color = $('<a class="color"><div class="colorInner"></div></a>');
        $container.prepend($track);
        $container.prepend($color);

        var self          = this
        //,   $track        = $container.find(".track")
        //,   $color        = $container.find(".color")
        ,   $canvas       = null
        //,   $colorInput   = $container.find(".colorInput")
        ,   $dropdown     = $container.find(".dropdown")
        ,   $dropdownItem = $dropdown.find("li").remove()

        ,   context      = null
        ,   mouseIsDown  = false
        ,   hasCanvas    = !!document.createElement("canvas").getContext
        ,   touchEvents  = "ontouchstart" in document.documentElement
        ;

        this.colorHex = "";
        this.colorRGB = "";

        function initialize()
        {
            if(hasCanvas)
            {
                $canvas = $("<canvas></canvas>");
                $track.append($canvas);

                context = $canvas[0].getContext( "2d" );

                setImage();
            }
            else
            {
                $.each(self.options.colors, function(index, color)
                {
                    var $clone = $dropdownItem.clone();

                    $clone.css("backgroundColor", color);
                    $clone.attr("data-color", color);

                    $dropdown.append($clone);
                });
            }

            var inputVal = $colorInput.val();
            if (inputVal) {
                $color.find(".colorInner").css("backgroundColor", inputVal);
            }

            setEvents();

            return self;
        }

        function setImage()
        {
            var colorPicker   = new Image()
            ,   backgroundUrl = 'data:image/jpeg;base64,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'
            ;

            $track.css("background-image", "none");

            $(colorPicker).load(function()
            {
                $canvas.attr("width", this.width);
                $canvas.attr("height", this.height);

                context.drawImage(colorPicker, 0, 0, this.width, this.height);
            });

            colorPicker.src = self.options.backgroundUrl || backgroundUrl;
        }

        function setEvents()
        {
            var _self       = this
            ,   eventType   = touchEvents ? "touchstart" : "mousedown"
            ;

            if(hasCanvas)
            {
                $color.bind(eventType, function(event)
                {
                    event.preventDefault();
                    event.stopPropagation();

                    $track.toggle();

                    $(document).bind("mousedown.colorpicker", function(event)
                    {
                        $(document).unbind(".colorpicker");

                        $track.hide();
                    });
                });

                if(!touchEvents)
                {
                    $canvas.mousedown(function(event)
                    {
                        mouseIsDown = true;

                        getColorCanvas(event);

                        $(document).bind("mouseup.colorpicker", function(event)
                        {
                            mouseIsDown = false;

                            $(document).unbind(".colorpicker");

                            $track.hide();

                            return false;
                        });

                        return false;
                    });

                    $canvas.mousemove(getColorCanvas);
                }
                else
                {
                    $canvas.bind("touchstart", function(event)
                    {
                        mouseIsDown = true;

                        getColorCanvas(event.originalEvent.touches[0]);

                        return false;
                    });

                    $canvas.bind("touchmove", function(event)
                    {
                        getColorCanvas(event.originalEvent.touches[0]);

                        return false;
                    });

                    $canvas.bind("touchend", function(event)
                    {
                        mouseIsDown = false;

                        $track.hide();

                        return false;
                    });
                }
            }
            else
            {
                $color.bind("mousedown", function(event)
                {
                    event.preventDefault();
                    event.stopPropagation();

                    $dropdown.toggle();
                });

                $dropdown.delegate("li", "mousedown", function(event)
                {
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    var color = $(this).attr("data-color");

                    self.setColor(color);

                    $dropdown.hide();
                });
            }
        }

        function getColorCanvas(event)
        {
            if(1 || mouseIsDown)
            {
                var $target   = $(event.target)
                ,   offset    = $target.offset()
                ,   colorData = context.getImageData(event.pageX - offset.left, event.pageY - offset.top, 1, 1).data
                ;

                self.setColor("rgb(" + colorData[0] + "," + colorData[1] + "," + colorData[2] + ")");

                $container.trigger("change", [self.colorHex, self.colorRGB]);
            }
        }

        this.setColor = function(color)
        {
            if(color.indexOf("#") >= 0)
            {
                self.colorHex = color;
                self.colorRGB = self.hexToRgb(self.colorHex);
            }
            else
            {
                self.colorRGB = color;
                self.colorHex = self.rgbToHex(self.colorRGB);
            }

            $color.find(".colorInner").css("backgroundColor", self.colorHex);
            $colorInput.val(self.colorHex);
        };

        this.hexToRgb = function(hex)
        {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

            return "rgb(" + parseInt(result[1], 16) + "," + parseInt(result[2], 16) + "," + parseInt(result[3], 16) + ")";
        };

        this.rgbToHex = function(rgb)
        {
            var result = rgb.match(/\d+/g);

            function hex(x)
            {
                digits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F");
                return isNaN(x) ? "00" : digits[(x - x % 16 ) / 16] + digits[x % 16];
            }

            return "#" + hex(result[0]) + hex(result[1]) + hex(result[2]);
        };

       return initialize();
    }

    $.fn[pluginName] = function(options)
    {
        return this.each(function()
        {
            if(!$.data(this, "plugin_" + pluginName))
            {
                $.data(this, "plugin_" + pluginName, new Plugin($(this), options));
            }
        });
    };
}));
