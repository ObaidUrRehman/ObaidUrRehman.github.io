---
layout: post
title: Example content
---
## Magic strings are bad

Don't use magic strings for controller, service or directive names or any where for that matter. Its a bad practice that will always waste your time. Always keep the name of the service or controller within the class as a static property and refrence it when you define it in angular. Here is an example service.

{% highlight js %}
module App {

   export class userService {

      public static IName = "userService";
      public static $inject = ["$http", '$modal'];

      constructor(
         private $http: ng.IHttpService,
         private $modal: any
      ) {
      }

      get() {
         this.$http.get(/api/users).then();
      }
   } 
}
{% endhighlight %}


Then, define your angular service like this:

{% highlight js %}
angular.service(App.userService.IName, App.userService);
{% endhighlight %}