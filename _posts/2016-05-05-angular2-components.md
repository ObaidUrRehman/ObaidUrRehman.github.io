---
layout: post
title: Angular2 Components
---

In Angular2 components are the basic building block that we use to build and specify our application logic in a page. They are the core part of the framework. In a way they can be compared to a combination of Directives & Controllers in Angular1.x but are wildly different.

### A Bare minimum component
With that being said, lets dive into some code and build our first component that renders our message on the view that is defined as a property of the component:

{% highlight js %}
import { Component } from '@angular/core';

@Component({
  selector: 'app-component',
  template:`<div>Hello my name is {{name}} . <button (click)="displayName()">Say My Name</button></div>`
})
export class AppComponent {
  name: string;
  
  constructor() {
    this.name = 'Adnan';
  }
  
  displayName() {
    alert('My name is', this.name)
  }
  
}

{% endhighlight %}

A couple of points here:

* As you can see we have imported <code>Component</code> from the angular library. It is used to decorate and add metadata to our component class so
  when Angular bootstraps our application it knows what type it is.
* The <code>selector</code> is what tells the angular to watch out for in the DOM and replace it with the template of our component. 
* The <code>template</code> hold our html that is eventually rendered to the view. We can also use <code>templateUrl</code> and move our html out of of the ts typescript file. This is something you would want to do when you template grows big and want to maintain a separation of concerns.
* A you may have noticed the <code>name</code> is a property of our component class and is available in the template through interpolation. 

In our html using this component is simply a matter of using it like this:

{% highlight html %}
<app-component></app-component>
{% endhighlight %}

### Component Lifecycle

When the Angular framework instantiates a component it calls the constructor of our component class and may inject some other required object if specified. Before and after that constructor is called it goes through a series of steps that we can track by hooking into the lifecycle of a component. You can find a full list of Lifecycle Hooks at <a href="https://angular.io/docs/ts/latest/guide/lifecycle-hooks.html">Angular Docs</a>. The following diagram sums up the component lifecycle:


![Angular2 Component Lifecycle](/images/angular2-component-lifecycle.png "Angular2 Component Lifecycle")

Lets make use of the <code>ngInit()</code> hook and move our name property initialization there. We want to keep the constructor clear of any initializations and new-ings.

{% highlight js %}
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-component',
  template:`<div>Hello my name is {{name}} . <button (click)="displayName()">Say My Name</button></div>`
})
export class AppComponent implements OnInit {
  name: string;
  
  constructor() {
  }
  
   ngOnInit() { 
    this.name = 'Adnan'; 
  }
  
  displayName() {
    alert('My name is', this.name)
  }
  
}

{% endhighlight %}


### Passing data to component via @Input and @Output Properties
The component we created is a very simple one. Now lets suppose we want that name property to be provided externally (by some other component) so we can
possibly use it with multiple names and as a reusable component. Here is where the @Input property comes into play.


{% highlight js %}
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-component',
  template:`<div>Hello my name is {{name}} . <button (click)="displayName()">Say My Name</button></div>`
})
export class AppComponent implements OnInit {
  @Input() name: string;
   
  constructor() {
  }
  
   ngOnInit() { 
    
  }
  
  displayName() {
    alert('My name is', this.name)
  }
}
{% endhighlight %}

Now, to pass data to your template you simple pass it as:

{% highlight html %}
<app-component [name]="'Obaid'"></app-component>
{% endhighlight %}

The output property as you might have guessed is the exact opposite that allows a component to emit an event that may have a value.
You can learn more about it at the <a href='https://angular.io/docs/ts/latest/cookbook/component-communication.html'>Angular2 docs</a>

### Injecting services into components

Dependency Injection comes into play when your component is dependent on some other component. Angular2's DI is vastly different 
from the one in Angular2 and you can find more details in the <a href='https://angular.io/docs/ts/latest/guide/dependency-injection.html'>docs</a>.
Lets suppose you might want to set the title of the browser bar, here is how you would inject the <code>Title</code> service:

{% highlight js %}
import { Component, OnInit, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-component',
  template:`<div>Hello my name is {{name}} . <button (click)="displayName()">Say My Name</button></div>`
})
export class AppComponent implements OnInit {
  @Input() name: string;
   
  constructor(private titleService: Title) {
  }
  
  ngOnInit() { 
    this.titleService.setTitle(name);
  }
  
  displayName() {
    alert('My name is', this.name)
  }
}
{% endhighlight %}

Point to note:

* The constructor takes the <code>Title</code> service as a parameter which the Angular runtime provides while new-ing the component object.

This example comes from the <a href='https://angular.io/docs/ts/latest/cookbook/set-document-title.html'>Angular2 cookbook</a>.
 
### Conclusion
A lot has changed in Angular2 and we have barely scratched the surface. It might seem intimidating at first but once you get used to
this component notion, there is no going back since it really help you keeping you code clean and well-defined.












