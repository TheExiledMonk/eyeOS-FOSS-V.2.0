/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/**
 * A window widget
 *
 * More information can be found in the package description {@link qx.ui.window}.
 *
 * @state active Whether the window is activated
 * @state maximized Whether the window is maximized
 *
 * @childControl statusbar {qx.ui.container.Composite} statusbar container which shows the statusbar text
 * @childControl statusbar-text {qx.ui.basic.Label} text of the statusbar
 * @childControl pane {qx.ui.container.Composite} window pane which holds the content
 * @childControl captionbar {qx.ui.container.Composite} Container for all widgets inside the captionbar
 * @childControl icon {qx.ui.basic.Image} icon at the left of the captionbar
 * @childControl title {qx.ui.basic.Label} caption of the window
 * @childControl minimize-button {qx.ui.form.Button} button to minimize the window
 * @childControl restore-button {qx.ui.form.Button} button to restore the window
 * @childControl maximize-button {qx.ui.form.Button} button to maximize the window
 * @childControl close-button {qx.ui.form.Button} button to close the window
 */
qx.Class.define("qx.ui.window.Window",
{
  extend : qx.ui.core.Widget,

  include :
  [
    qx.ui.core.MRemoteChildrenHandling,
    qx.ui.core.MRemoteLayoutHandling,
    qx.ui.core.MResizable,
    qx.ui.core.MMovable,
    qx.ui.core.MContentPadding
  ],





  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param caption {String} The caption text
   * @param icon {String} The URL of the caption bar icon
   */
  construct : function(caption, icon)
  {
    this.base(arguments);

    // configure internal layout
    this._setLayout(new qx.ui.layout.VBox());

    // force creation of captionbar
    this._createChildControl("captionbar");
    this._createChildControl("pane");

    // apply constructor parameters
    if (icon != null) {
      this.setIcon(icon);
    }

    if (caption != null) {
      this.setCaption(caption);
    }

    // Update captionbar
    this._updateCaptionBar();

    // Activation listener
    this.addListener("mousedown", this._onWindowMouseDown, this, true);

    // Focusout listener
    this.addListener("focusout", this._onWindowFocusOut, this);

    // Automatically add to application root.
    qx.core.Init.getApplication().getRoot().add(this);

    // Initialize visibiltiy
    this.initVisibility();

    // Register as root for the focus handler
    qx.ui.core.FocusHandler.getInstance().addRoot(this);
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Class} The default window manager class. */
    DEFAULT_MANAGER_CLASS : qx.ui.window.Manager
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired before the window is closed.
     *
     * The close action can be prevented by calling
     * {@link qx.event.type.Event#preventDefault} on the event object
     */
    "beforeClose" : "qx.event.type.Event",

    /** Fired if the window is closed */
    "close" : "qx.event.type.Event",

    /**
     * Fired before the window is minimize.
     *
     * The minimize action can be prevented by calling
     * {@link qx.event.type.Event#preventDefault} on the event object
     */
    "beforeMinimize" : "qx.event.type.Event",

    /** Fired if the window is minimized */
    "minimize" : "qx.event.type.Event",

    /**
     * Fired before the window is maximize.
     *
     * The maximize action can be prevented by calling
     * {@link qx.event.type.Event#preventDefault} on the event object
     */
    "beforeMaximize" : "qx.event.type.Event",

    /** Fired if the window is maximized */
    "maximize" : "qx.event.type.Event",

    /**
     * Fired before the window is restored from a minimized or maximized state.
     *
     * The restored action can be prevented by calling
     * {@link qx.event.type.Event#preventDefault} on the event object
     */
    "beforeRestore" : "qx.event.type.Event",

    /** Fired if the window is restored from a minimized or maximized state */
    "restore" : "qx.event.type.Event"
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /*
    ---------------------------------------------------------------------------
      INTERNAL OPTIONS
    ---------------------------------------------------------------------------
    */

    // overridden
    appearance :
    {
      refine : true,
      init : "window"
    },


    // overridden
    visibility :
    {
      refine : true,
      init : "excluded"
    },


    // overridden
    focusable :
    {
      refine : true,
      init : true
    },


    /**
     * If the window is active, only one window in a single qx.ui.window.Manager could
     *  have set this to true at the same time.
     */
    active :
    {
      check : "Boolean",
      init : false,
      apply : "_applyActive",
      event : "changeActive"
    },



    /*
    ---------------------------------------------------------------------------
      BASIC OPTIONS
    ---------------------------------------------------------------------------
    */

    /** Should the window be always on top */
    alwaysOnTop :
    {
      check : "Boolean",
      init : false,
      event : "changeAlwaysOnTop"
    },

    /** Should the window be modal (this disables minimize and maximize buttons) */
    modal :
    {
      check : "Boolean",
      init : false,
      event : "changeModal"
    },


    /** The text of the caption */
    caption :
    {
      apply : "_applyCaptionBarChange",
      event : "changeCaption",
      nullable : true
    },


    /** The icon of the caption */
    icon :
    {
      check : "String",
      nullable : true,
      apply : "_applyCaptionBarChange",
      event : "changeIcon",
      themeable : true
    },


    /** The text of the statusbar */
    status :
    {
      check : "String",
      nullable : true,
      apply : "_applyStatus",
      event :"changeStatus"
    },




    /*
    ---------------------------------------------------------------------------
      HIDE CAPTIONBAR FEATURES
    ---------------------------------------------------------------------------
    */

    /** Should the close button be shown */
    showClose :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange",
      themeable : true
    },


    /** Should the maximize button be shown */
    showMaximize :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange",
      themeable : true
    },


    /** Should the minimize button be shown */
    showMinimize :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange",
      themeable : true
    },




    /*
    ---------------------------------------------------------------------------
      DISABLE CAPTIONBAR FEATURES
    ---------------------------------------------------------------------------
    */

    /** Should the user have the ability to close the window */
    allowClose :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange"
    },


    /** Should the user have the ability to maximize the window */
    allowMaximize :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange"
    },


    /** Should the user have the ability to minimize the window */
    allowMinimize :
    {
      check : "Boolean",
      init : true,
      apply : "_applyCaptionBarChange"
    },




    /*
    ---------------------------------------------------------------------------
      STATUSBAR CONFIG
    ---------------------------------------------------------------------------
    */

    /** Should the statusbar be shown */
    showStatusbar :
    {
      check : "Boolean",
      init : false,
      apply : "_applyShowStatusbar"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** {Integer} Original top value before maximation had occoured */
    __restoredTop : null,

    /** {Integer} Original left value before maximation had occoured */
    __restoredLeft : null,



    /*
    ---------------------------------------------------------------------------
      WIDGET API
    ---------------------------------------------------------------------------
    */

    /**
     * The children container needed by the {@link qx.ui.core.MRemoteChildrenHandling}
     * mixin
     *
     * @return {qx.ui.container.Composite} pane sub widget
     */
    getChildrenContainer : function() {
      return this.getChildControl("pane");
    },


    // overridden
    /**
     * @lint ignoreReferenceField(_forwardStates)
     */
    _forwardStates :
    {
      active : true,
      maximized : true
    },


    // overridden
    setLayoutParent : function(parent)
    {
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        parent && this.assertInterface(
          parent, qx.ui.window.IDesktop,
          "Windows can only be added to widgets, which implement the interface "+
          "qx.ui.window.IDesktop. All root widgets implement this interface."
        );
      }
      this.base(arguments, parent);
    },


    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
        case "statusbar":
          control = new qx.ui.container.Composite(new qx.ui.layout.HBox());
          this._add(control);
          control.add(this.getChildControl("statusbar-text"));
          break;

        case "statusbar-text":
          control = new qx.ui.basic.Label();
          control.setValue(this.getStatus());
          break;

        case "pane":
          control = new qx.ui.container.Composite();
          this._add(control, {flex: 1});
          break;

        case "captionbar":
          // captionbar
          var layout = new qx.ui.layout.Grid();
          layout.setRowFlex(0, 1);
          layout.setColumnFlex(1, 1);
          control = new qx.ui.container.Composite(layout);
          this._add(control);

          // captionbar events
          control.addListener("dblclick", this._onCaptionMouseDblClick, this);

          // register as move handle
          this._activateMoveHandle(control);
          break;

        case "icon":
          control = new qx.ui.basic.Image(this.getIcon());
          this.getChildControl("captionbar").add(control, {row: 0, column:0});
          break;

        case "title":
          control = new qx.ui.basic.Label(this.getCaption());
          control.setWidth(0);
          control.setAllowGrowX(true);

          var captionBar = this.getChildControl("captionbar");
          captionBar.add(control, {row: 0, column:1});
          break;

        case "minimize-button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.addListener("execute", this._onMinimizeButtonClick, this);

          this.getChildControl("captionbar").add(control, {row: 0, column:2});
          break;

        case "restore-button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.addListener("execute", this._onRestoreButtonClick, this);

          this.getChildControl("captionbar").add(control, {row: 0, column:3});
          break;

        case "maximize-button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.addListener("execute", this._onMaximizeButtonClick, this);

          this.getChildControl("captionbar").add(control, {row: 0, column:4});
          break;

        case "close-button":
          control = new qx.ui.form.Button();
          control.setFocusable(false);
          control.addListener("execute", this._onCloseButtonClick, this);

          this.getChildControl("captionbar").add(control, {row: 0, column:6});
          break;
      }

      return control || this.base(arguments, id);
    },





    /*
    ---------------------------------------------------------------------------
      CAPTIONBAR INTERNALS
    ---------------------------------------------------------------------------
    */

    /**
     * Updates the status and the visibility of each element of the captionbar.
     */
    _updateCaptionBar : function()
    {
      var btn;

      var icon = this.getIcon();
      if (icon) {
        this.getChildControl("icon").setSource(icon);
        this._showChildControl("icon");
      } else {
        this._excludeChildControl("icon");
      }

      var caption = this.getCaption()
      if (caption) {
        this.getChildControl("title").setValue(caption);
        this._showChildControl("title");
      } else {
        this._excludeChildControl("title");
      }

      if (this.getShowMinimize())
      {
        this._showChildControl("minimize-button");

        btn = this.getChildControl("minimize-button");
        this.getAllowMinimize() ? btn.resetEnabled() : btn.setEnabled(false);
      }
      else
      {
        this._excludeChildControl("minimize-button");
      }

      if (this.getShowMaximize())
      {
        if (this.isMaximized())
        {
          this._showChildControl("restore-button");
          this._excludeChildControl("maximize-button");
        }
        else
        {
          this._showChildControl("maximize-button");
          this._excludeChildControl("restore-button");
        }

        btn = this.getChildControl("maximize-button");
        this.getAllowMaximize() ? btn.resetEnabled() : btn.setEnabled(false);
      }
      else
      {
        this._excludeChildControl("maximize-button");
        this._excludeChildControl("restore-button");
      }

      if (this.getShowClose())
      {
        this._showChildControl("close-button");

        btn = this.getChildControl("close-button");
        this.getAllowClose() ? btn.resetEnabled() : btn.setEnabled(false);
      }
      else
      {
        this._excludeChildControl("close-button");
      }
    },





    /*
    ---------------------------------------------------------------------------
      USER API
    ---------------------------------------------------------------------------
    */

    /**
     * Closes the current window instance.
     * Technically calls the {@link qx.ui.core.Widget#hide} method.
     */
    close : function()
    {
      if (!this.isVisible()) {
        return;
      }

      if (this.fireNonBubblingEvent("beforeClose", qx.event.type.Event, [false, true]))
      {
        this.hide();
        this.fireEvent("close");
      }
    },


    /**
     * Opens the window.
     */
    open : function()
    {
      this.show();
      this.setActive(true);
      this.focus();
    },


    /**
     * Centers the window to the parent.
     *
     * This call works with the size of the parent widget and the size of
     * the window as calculated in the last layout flush. It is best to call
     * this method just after rendering the window in the "resize" event:
     * <pre class='javascript'>
     *   win.addListenerOnce("resize", this.center, this);
     * </pre>
     */
    center : function()
    {
      var parent = this.getLayoutParent();
      if (parent)
      {
        var bounds = parent.getBounds();
        if (bounds)
        {
          var hint = this.getSizeHint();

          var left = Math.round((bounds.width - hint.width) / 2);
          var top = Math.round((bounds.height - hint.height) / 2);

          if (top < 0) {
            top = 0;
          }

          this.moveTo(left, top);

          return;
        }
      }

      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        this.warn("Centering depends on parent bounds!");
      }
    },


    /**
     * Maximize the window.
     */
    maximize : function()
    {
      // If the window is already maximized -> return
      if (this.isMaximized()) {
        return;
      }

      // First check if the parent uses a canvas layout
      // Otherwise maximize() is not possible
      var parent = this.getLayoutParent();
      if (parent != null && parent.supportsMaximize())
      {
        if (this.fireNonBubblingEvent("beforeMaximize", qx.event.type.Event, [false, true]))
        {
          if (!this.isVisible()) {
            this.open();
          }

          // store current dimension and location
          var props = this.getLayoutProperties();
          this.__restoredLeft = props.left === undefined ? 0 : props.left;
          this.__restoredTop = props.top === undefined ? 0 : props.top;

          // Update layout properties
          this.setLayoutProperties({
            left: null,
            top: null,
            edge: 0
          });

          // Add state
          this.addState("maximized");

          // Update captionbar
          this._updateCaptionBar();

          // Fire user event
          this.fireEvent("maximize");
        }
      }
    },


    /**
     * Minimized the window.
     */
    minimize : function()
    {
      if (!this.isVisible()) {
        return;
      }

      if (this.fireNonBubblingEvent("beforeMinimize", qx.event.type.Event, [false, true]))
      {
        // store current dimension and location
        var props = this.getLayoutProperties();
        this.__restoredLeft = props.left === undefined ? 0 : props.left;
        this.__restoredTop = props.top === undefined ? 0 : props.top;

        this.removeState("maximized");
        this.hide();
        this.fireEvent("minimize");
      }
    },


    /**
     * Restore the window to <code>"normal"</code>, if it is
     * <code>"maximized"</code> or <code>"minimized"</code>.
     */
    restore : function()
    {
      if (this.getMode() === "normal") {
        return;
      }

      if (this.fireNonBubblingEvent("beforeRestore", qx.event.type.Event, [false, true]))
      {
        if (!this.isVisible()) {
          this.open();
        }

        // Restore old properties
        var left = this.__restoredLeft;
        var top = this.__restoredTop;

        this.setLayoutProperties({
          edge : null,
          left : left,
          top : top
        });

        // Remove maximized state
        this.removeState("maximized");

        // Update captionbar
        this._updateCaptionBar();

        // Fire user event
        this.fireEvent("restore");
      }
    },


    /**
     * Set the window's position relative to its parent
     *
     * @param left {Integer} The left position
     * @param top {Integer} The top position
     */
    moveTo : function(left, top)
    {
      if (this.isMaximized()) {
        return;
      }

      this.setLayoutProperties({
        left : left,
        top : top
      });
    },

    /**
     * Return <code>true</code> if the window is in maximized state,
     * but note that the window in maximized state could also be invisible, this
     * is equivalent to minimized. So use the {@link qx.ui.window.Window#getMode}
     * to get the window mode.
     *
     * @return {Boolean} <code>true</code> if the window is maximized,
     *   <code>false</code> otherwise.
     */
    isMaximized : function()
    {
      return this.hasState("maximized");
    },

    /**
     * Return the window mode as <code>String</code>:
     * <code>"maximized"</code>, <code>"normal"</code> or <code>"minimized"</code>.
     *
     * @return {String} The window mode as <code>String</code> value.
     */
    getMode : function()
    {
      if(!this.isVisible()) {
        return "minimized";
      } else {
        if(this.isMaximized()) {
          return "maximized";
        } else {
          return "normal";
        }
      }
    },

    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */

    // property apply
    _applyActive : function(value, old)
    {
      if (old) {
        this.removeState("active");
      } else {
        this.addState("active");
      }
    },


    /**
     * Returns the element, to which the content padding should be applied.
     *
     * @return {qx.ui.core.Widget} The content padding target.
     */
    _getContentPaddingTarget : function() {
      return this.getChildControl("pane");
    },


    // property apply
    _applyShowStatusbar : function(value, old)
    {
      if (value) {
        this._showChildControl("statusbar");
      } else {
        this._excludeChildControl("statusbar");
      }
    },


    // property apply
    _applyCaptionBarChange : function(value, old) {
      this._updateCaptionBar();
    },


    // property apply
    _applyStatus : function(value, old)
    {
      var label = this.getChildControl("statusbar-text", true);
      if (label) {
        label.setValue(value);
      }
    },


    /*
    ---------------------------------------------------------------------------
      BASIC EVENT HANDLERS
    ---------------------------------------------------------------------------
    */

    /**
     * Stops every event
     *
     * @param e {qx.event.type.Event} any event
     */
    _onWindowEventStop : function(e) {
      e.stopPropagation();
    },


    /**
     * Focuses the window instance.
     *
     * @param e {qx.event.type.Mouse} mouse down event
     */
    _onWindowMouseDown : function(e) {
      this.setActive(true);
    },


    /**
     * Listens to the "focusout" event to deactivate the window (if the
     * currently focused widget is not a child of the window)
     *
     * @param e {qx.event.type.Focus} focus event
     */
    _onWindowFocusOut : function(e) {
      // only needed for non-modal windows
      if (this.getModal())
      {
        return;
      }

      // get the current focused widget and check if it is a child
      var current = e.getRelatedTarget();
      if (current != null && !qx.ui.core.Widget.contains(this, current))
      {
        this.setActive(false);
      }
    },


    /**
     * Maximizes the window or restores it if it is already
     * maximized.
     *
     * @param e {qx.event.type.Mouse} double click event
     */
    _onCaptionMouseDblClick : function(e)
    {
      if (this.getAllowMaximize()) {
        this.isMaximized() ? this.restore() : this.maximize();
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENTS FOR CAPTIONBAR BUTTONS
    ---------------------------------------------------------------------------
    */

    /**
     * Minimizes the window, removes all states from the minimize button and
     * stops the further propagation of the event (calling {@link qx.event.type.Event#stopPropagation}).
     *
     * @param e {qx.event.type.Mouse} mouse click event
     */
    _onMinimizeButtonClick : function(e)
    {
      this.minimize();
      this.getChildControl("minimize-button").reset();
    },


    /**
     * Restores the window, removes all states from the restore button and
     * stops the further propagation of the event (calling {@link qx.event.type.Event#stopPropagation}).
     *
     * @param e {qx.event.type.Mouse} mouse click event
     */
    _onRestoreButtonClick : function(e)
    {
      this.restore();
      this.getChildControl("restore-button").reset();
    },


    /**
     * Maximizes the window, removes all states from the maximize button and
     * stops the further propagation of the event (calling {@link qx.event.type.Event#stopPropagation}).
     *
     * @param e {qx.event.type.Mouse} mouse click event
     */
    _onMaximizeButtonClick : function(e)
    {
      this.maximize();
      this.getChildControl("maximize-button").reset();
    },


    /**
     * Closes the window, removes all states from the close button and
     * stops the further propagation of the event (calling {@link qx.event.type.Event#stopPropagation}).
     *
     * @param e {qx.event.type.Mouse} mouse click event
     */
    _onCloseButtonClick : function(e)
    {
      this.close();
      this.getChildControl("close-button").reset();
    }
  }
});
