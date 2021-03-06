/*
 * Router example for ConboJS
 * Demonstrates how to use basic routing in ConboJS using ES2015 and class import 
 * 
 * @author	Neil Rackett
 */

/**
 * Namespaces enable ConboJS binding
 */
let ns = conbo('example');

class MyRouter extends conbo.Router
{
	declarations()
	{
		// Route:Name pairs
		this.routes =
		{
			'bold/:name': 'BoldView',
			'italic(/:name)': 'ItalicView'
		}
	}
}

class MyContext extends conbo.Context
{
	initialize()
	{
		this.mapSingleton('router', MyRouter, this.addTo());
	}
}

class BoldView extends conbo.View
{
	declarations(options)
	{
		this.template = '<b>Hello <span cb-text="name"></span>!</b>';
	}
	
	initialize(options)
	{
		this.name = options.name || 'whoever you are';
	}
}

class ItalicView extends BoldView
{
	declarations(options)
	{
		this.template = '<i>See you later, <span cb-text="name"></span>!</i>';
	}
}

class RouterExample extends conbo.Application
{
	declarations()
	{
		this.contextClass = MyContext;
		this.namespace = ns;
		
		// Use undefined for property injection
		this.router = undefined;
	}
	
	initialize()
	{
		this.addEventListener(conbo.ConboEvent.CREATION_COMPLETE, this.creationCompleteHandler, this);
	}
	
	creationCompleteHandler(event)
	{
		this.router
			.addEventListener(conbo.ConboEvent.FAULT, this.faultHandler, this) // Unrecognised route
			.addEventListener(conbo.ConboEvent.ROUTE, this.routeHandler, this) // Recognised route
			.start()
			;
	}
	
	routeHandler(event)
	{
		var options = {name:event.parameters[0]};
		
		this.content.innerHTML = '';
		this.content.appendChild(new ns[event.name](options).el);
	}
	
	faultHandler(event)
	{
		this.content.innerHTML = "I don't recognise that route, try another one from the list below!";
	}
}
	
// Import specified classes to your namespace
ns.import({ RouterExample, BoldView, ItalicView });
