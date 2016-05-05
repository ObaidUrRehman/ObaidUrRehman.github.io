---
layout: post
title: Angular2 Components
---

In Angular2 components are the basic building block that we use to build and specify our application logic in a page. They are the core part of the framework. In a way they can be compared to a combination of Directives & Controllers in Angular1.x but are wildly different.

### A Bare minimum component
With that being said, lets dive into some code and build our first component that renders our message on the view that is defined as a property of the component:

{% highlight js %}
import {Component} from 'angular2/angular2'

@Component({
  selector: 'demo-component',
  template: '<div>Hello my name is {{name}}. <button (click)="displayName()">Say My Name</button></div>'
})
export class DemoComponent {
  name: string;
  
  constructor() {
    this.name = 'Adnan'
  }
  
  displayName() {
    alert('My name is', this.name)
  }
}
{% endhighlight %}

A couple of points here:

* As you can see we have imported <code>Component</code> from the angular library. It is used a decorator to add metadata with our component class so
  when Angular bootstraps our application it knows what type it is.
* The <code>selector</code> is what tells the angular to watch out for in the DOM and replace it with the template of our component. 
* The <code>template</code> hold our html that is eventually rendered to the view. We can also use <code>templateUrl</code> and move our html out of of the ts typescript file. This is something you would want to do when you template grows big and want to maintain a separation of concerns.

In our html using this component is simply a matter of using it like this:

{% highlight html %}
<demo-component></demo-component>
{% endhighlight %}

### Component Lifecycle

When the Angular framework instantiates a component it calls the constructor of our component class and may inject some other required object if specified. Before and after that constructor is called it goes through a series of steps that we can track by hooking into the lifecycle of a component. You can find a full list of Lifecycle Hooks at <a href="https://angular.io/docs/ts/latest/guide/lifecycle-hooks.html">Angular Docs</a>. The following diagram sums up the component lifecycle:


Lets make use of the <code>ngInit()</code> hook and move our name property initialization there. We want to keep the constructor clear of any initializations and new-ings.

{% highlight js %}
import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'demo-component',
  template: '<div>Hello my name is {{name}}. <button (click)="displayName()">Say My Name</button></div>'
})
export class DemoComponent implements OnInit {
  name: string;
  
  ngOnInit() { 
    this.name = 'Adnan'; 
  }
  
  constructor() {
    
  }
  
  displayName() {
    alert('My name is', this.name)
  }
}
{% endhighlight %}


### @Input and @Output Properties
The component we created is a very simple one. Now lets suppose we want that name property to be provided externally (by some other component) so we can
possibly use it with multiple names and as a reusable component. Here is where the @Input property comes into play.


{% highlight js %}
import {Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'demo-component',
  template: '<div>Hello my name is {{name}}. <button (click)="displayName()">Say My Name</button></div>'
})
export class DemoComponent implements OnInit {
  name: string;
  @input name;
  
  ngOnInit() { 
     
  }
  
  constructor() {
    
  }
  
  displayName() {
    alert('My name is', this.name)
  }
}
{% endhighlight %}

The output property as you might have guessed is the exact opposite that allows a component to emit an event that may have a value.

### Injecting services into components

###










