# CbUi Javascript user interface framework

The CbUi framework is built upon [base2](http://base2.googlecode.com/) and
[jquery](http://jquery.com) to provide a way of building user interfaces in a
similar way as you'd expect from a classical desktop UI library. There is an
event passing system and a way of defining widget classes. Widgets can be
nested in certain ways and there is a class hierarchy which can be extended.

Some widgets depend on other culturebase projects, but most can be used on
their own.

## Available widgets

CbUi offers a wide array of widgets:

* widget.js/widget: The base widget of everything. Handles translation
                    hide/show, resizing, movement and life cycle for itself.
* window.js
  * frame: A lightweight container for grouping widgets. It can notify its
           children of changes in either of them or in the frame itself.
  * window: A more fully featured container. Manages the life cycle of any
            widgets contained in it, can load a template for itself via ajax
            and can validate its children. You need the Culturebase "cbShadow"
            module or another source of addShadow() to use the drop shadows.
  * language\_window: Window to choose the active language. Choosing a
            language will translate the UI into the new language and close the
            window.
  * text\_window: Window with translatable and dynamically replacable text
                 bricks. You can can pass a "texts" parameter to the
                 constructor and those texts will be taken as patterns to be
                 replaced in any translation. This can be used for things like
                 the the user's name which will show up in different places,
                 depending on language, but shouldn't be added to the general
                 translations.
* text.js
  * text: A simple text widget with a label that gets translated by the
          translation system.
  * multiText: Several translated texts which can be switched in place at
               runtime.
* input.js
  * input: The base widget for all input widgets. Handles validation and
           unified retrieval of values
  * inputText: Text input widget with a default text to be shown if there is
               no user supplied text.
  * password: Password input widget, also with a default text. The default
              text is shown as clear text.
  * select: Select box with options to be chosen from.
  * checkbox: Pretty simple checkbox. 
  * searchBox: Ajax-driven autocompleting pair of input fields. One of the
               fields is an descriptive text shown to the user, the other one
               can be used for an ID is not shown. In order to use this you
               need the Culturebase "autocomplete" jQuery module.
  * inputTextArea: Like inputText but for longer texts.
* button.js
  * textButton: The same as text for now.
  * langSelect: A text button to show the currently selected language. On click
                it will open the language window where a different one can be
                chosen.
  * imgButton: Nothing special.
  * closeButton: An imgButton which will search for an enclosing window an
                 close that on click.
  * langFlag: An imgButton that shows the currently selected language as flag.
  * langSelectFlag: A langFlag that on click does the same as langSelect.
  * chooseList: A list of things to be chosen from. If one of them is clicked
                an action can be triggered.
  * langChooseList: A list of available languages. On click the UI is translated
                    into the selected language and the current window is
                    closed.
* loader.js/loader: A loading indicator which blocks any UI interaction until
                    hidden or destroyed.
* moreless.js
  * moreLess: A frame which shows expands and shrinks its content on click of
              specific buttons (or programatically)
  * moreLessText: A moreLess frame for text. You can specify a maximum text
                  length for the "less" state and the text will be cut
                  accordingly.
  * moreLessElements: A moreLess frame for HTML elements. You can configure the
                      maximum number of children to be shown in the "less"
                      state.
* sortable.js/sortableFrame: A frame with items sortable by the jquery\_ui
                             "sortable" effect. Obviously you need
                             [jquery\_ui](http://jqueryui.com/) for this to
                             work.
* player.js: Video Players You need the Culturebase "player40" project or
             something compatible for those to actually do anything.
  * base\_player: Basic functionality for video players. Subclassed by all
                 actual players.
  * jw\_player: A flash based player built around
               [JwPlayer](http://www.longtailvideo.com/players/)
  * html5\_player: Player using the \<video\> tag.
  * dummy\_player: Not actually a player, but provides the same interface.
  * player: A wrapper around jw/html5/dummy which will select the best one
            depending on available media and client capacities.
  * playerVersions: A select box to choose from different versions of a video.
  * playerControls: A set of buttons to play/pause/stop ... a video.
  * playerSlides: Slide show with video attached to it. Don't ask ...

## Autocreating widgets

Widgets can be automatically created into HTML templates. For that to work you
have to add class attributes named "\_\_CbUi<Foo>" to the elements your widgets
(instances of $.CbWidget.foo in this case) expect as parent elements. Then you
have to sublcass $.CbWidget.window and pass such a template to its constructor.
It will automatically create the required widgets and manage their life cycles.

## Translation

The widget system requires a "brick source", an ajax endpoint to query for
translations. The labels of the requested bricks will be passed as GET
parameter "labels", another parameter "projects" contains the projects
configured in CbWidgetRegistry and the parameter "language" contains the
requested language in the form of a locale-like combination of language and
country code (incidentally the same thing Zend uses). Parameters are
URL-encoded and arrays are created the jQuery/PHP way by appending '[]' to the
parameter name. The response has to be a JSON-encoded object which maps the
labels to translated strings.

## Validation

There are several validators available for input widgets (see validate.js):

* nonempty
* email
* account (either email or alphanumeric lowercase of max 25 characters which
  may also contain '-', but not as first or last character.
* equals (checks that all widgets in a group have the same content)
* number
* editingFinished (for autocomplete, there are several editing stages)
* inputLength (configurable minimum and maximum length for text input)

You can create validators declaratively in the same way as widgets. Just add a
class "\_\_CbValidateFoo" for validator "foo" to the parent element of a widget.
The surrounding window will automatically create and use it.
