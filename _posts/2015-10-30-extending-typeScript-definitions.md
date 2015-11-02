---
layout: post
title: Extending DefinitelyTyped TypeScript Definitions
---
The type definitions at [DefinitelyTyped](http://definitelytyped.org/) are quite extensive and provide full coverage for popular libraries. You will 
rarely need to extend them. But if you ever need to (which I recently had to) here is how I recommend you should approach it.

<div class="message">
  <strong>Case In point:</strong> I use <a href="https://github.com/chieffancypants/angular-loading-bar">angular-loading-bar</a>, an excellent angular lib to display progress bar on my page. It does that 
  by intercepting XHR requests. I wanted a particular pooling XHR to not show the loading bar. All I had to do was pass an extra parameter to <a href="https://docs.angularjs.org/api/ng/service/$http#get">$http:</a> 
  
  {% highlight js %}
  this.$http.get('/api/notifications/', { ignoreLoadingBar: true});
  {% endhighlight %}
  
  Now the second parameter (which is the config object) is defined in the d.ts as `IRequestShortcutConfig` and it has no definition for the non-standard `ignoreLoadingBar` property.
</div>

Obviously its a very bad idea to modify the orignal d.ts files.

I keep all my type definitions in a folder named typings.

![Folder Structure](/images/typings-folder-structure.png "Folder Structure")

As you can see there is a custom.d.ts file. I use this to extend or define my own definitions. Here is how it looks like:

{% highlight js linenos %}

// Use this file to extend custom Type definitions for any of the typings

// angular.d.ts 
declare module ng {
   interface IRequestShortcutConfig {
      /**
        * Ignores this particular XHR requests from showing the loading bar.
        * See: https://github.com/chieffancypants/angular-loading-bar#ignoring-particular-xhr-requests
        */
      ignoreLoadingBar?: boolean;
   }
} 

{% endhighlight %}

The concept to understand here is Declaration Merging. In simple terms, the TypeScript compiler merges two separate 
declarations declared with the same name into a single definition. The `IRequestShortcutConfig` is already defined 
in the angular.d.ts file provided by DefinitelyTyped. Both declarations were merged into one. You can read more about 
declaration Merging [here at TypeScript site](http://www.typescriptlang.org/Handbook#declaration-merging).


