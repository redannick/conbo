/**
 * Server Application 
 * 
 * Base class for applications that don't require DOM, e.g. Node.js
 * 
 * @class		conbo.ServerApplication
 * @augments	conbo.EventDispatcher
 * @author		Neil Rackett
 * @param 		{object} options - Object containing initialisation options
 */
conbo.ServerApplication = conbo.EventDispatcher.extend(
/** @lends conbo.ServerApplication.prototype */
{
	/**
	 * Default context class to use
	 * You'll normally want to override this with your own
	 */
	contextClass: conbo.Context,
	
	/**
	 * Constructor: DO NOT override! (Use initialize instead)
	 * @param options
	 */
	__construct: function(options)
	{
		options = conbo.clone(options || {});
		options.app = this;
		
		this.context = new this.contextClass(options);
	},
	
	toString: function()
	{
		return 'conbo.ServerApplication';
	}
	
}).implement(conbo.IInjectable);

__denumerate(conbo.ServerApplication.prototype);
