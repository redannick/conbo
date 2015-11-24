/**
 * Mutation observer example for Conbo.js
 * @author	Neil Rackett
 */
conbo('ns', function()
{
	var ns = this;
	
	ns.MyView = conbo.View.extend
	({
		template: 'An automagically instantiated view! <button cb-onclick="close">X</button>',
		
		initialize: function()
		{
			this.bindAll();
		},
		
		close: function()
		{
			this.remove();
		}
	});
	
	ns.MyApp = conbo.Application.extend
	({
		namespace: ns,
		
		initialize: function()
		{
			this.observeEnabled = true;
			this.bindAll();
		},
		
		addView: function()
		{
			this.$el.append('<p cb-view="MyView" />');
		}
	});
	
	/**
	 * ns.initDom automatically scans the DOM for cb-app declarations and
	 * instantiates the appropriate Application instance from the specified
	 * namespace
	 */
	ns.initDom();
	
});