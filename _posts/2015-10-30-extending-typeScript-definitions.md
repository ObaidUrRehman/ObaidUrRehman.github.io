---
layout: post
title: Extending DefinitelyTyped TypeScript Definitions
---
The type definitions at [DefinitelyTyped](http://definitelytyped.org/) are quite extensive and provide full coverage for popular libraries and you will 
rarely need to extend them. But if you ever need to (which I recently had to) here is how I'd recommend you should approach it.

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


