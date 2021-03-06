/**
 * Context & dependency injection example for ConboJS
 * @author	Neil Rackett
 */
conbo('ns', function()
{
	var ns = this;
	
	ns.HelloCommand = conbo.Command.extend
	({
		myModel: undefined,
		
		execute: function()
		{
			alert('Hello '+this.myModel.name+'!');
		}
	});
	
	/**
	 * Switch conbo.Hash for conbo.RemoteHash if you need web services
	 */
	ns.MyModel = conbo.Hash.extend
	({
		declarations: function() 
		{
			this.name = 'Conbo';
		}
	});
	
	ns.InputView = conbo.View.extend
	({
		/**
		 * Properties with a value of undefined that have been mapped to 
		 * singletons in the context are automatically injected
		 */
		myModel: undefined,
		
		template: 'My name is <input type="text" cb-bind="myModel.name" /><button cb-onclick="button_clickHandler">Submit</button>',
		
		initialize: function()
		{
			this.bindAll();
		},
		
		button_clickHandler: function()
		{
			this.context.dispatchEvent(new conbo.Event('hello'));
		}
	});
	
	ns.MyContext = conbo.Context.extend
	({
		/**
		 * Entry point
		 */
		initialize: function()
		{
			this.mapCommand('hello', ns.HelloCommand);
			this.mapSingleton('myModel', ns.MyModel);
		}
	});
	
	ns.MyApp = conbo.Application.extend
	({
		namespace: ns,
		
		/**
		 * Application will automatically use an instance of this class as 
		 * the application's context (event bus); uses vanilla conbo.Context
		 * if not specified
		 */
		get contextClass()
		{
			return ns.MyContext;
		},
		
		/**
		 * Entry point
		 */
		initialize: function()
		{
			this.inputView = new ns.InputView(this.context.addTo());
			this.appendView(this.inputView);
		}
	});
	
});