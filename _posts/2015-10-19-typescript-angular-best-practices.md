---
layout: post
title: AngularJs TypeScript Best Practices
---
Having worked on a couple of AngularJs apps using TypeScript, I have come up with a list of my own best practices that I follow to keep things smooth during development. 
These practices are by no means comprehensive or de-facto and are based on my development experiences.

## 1. Use TypeScript type definitions

If you are writing your Angular app in TypeScript I'd recommended that you use type definitions for AngularJS and all related components like 
<a href="https://github.com/angular-ui/ui-router">ng-ui-router</a>, <a href="https://github.com/angular-ui/bootstrap">angular-ui-bootstrap</a> etc.
At <a href="http://definitelytyped.org/">DefinitelyTyped</a> you can find definition files for popular libraries.
In the longer run it pays off using type definitions. You get the usual advantage of compile time type checking.

The <a href="http://definitelytyped.org/tsd/">TSD</a> is an excellent tool to find and install TypeScript definition files from the 
<a href="https://github.com/borisyankov/DefinitelyTyped">DefinitelyTyped</a> repository.

## 2. Strongly Typed Scopes
Keep your scopes strongly typed by extending `ng.IScope` like the following.

{% highlight js linenos %}
module App {
    export interface IAppScope extends ng.IScope {
    
    selectedUser: IUser;
    filterValue: any;
    
    getUser: (id: number) => IUser;
    close: () => void;
   }
}

{% endhighlight %}

Then, annotate your scopes when using it in a controller:

{% highlight js linenos %}
module App {
    export class myAppCtrl {
       public static $inject = ['$scope', 'userService'];
       
       constructor(
          private $scope: IAppScope,
          private userService: App.UserService){
          
          }
          
       this.$scope.getUser = (id: number) => {
          return userService.get(id);
       }
    }
}

{% endhighlight %}

## Strongly typed Server side API Objects

If you consume Rest APIs on the client side then take type checking to the next level by using <a href="http://type.litesolutions.net/">Typelite</a> for .Net or <a href="http://type.litesolutions.net/">ts-java</a> for Java. 
Use these tools to generate TypeScript type definitions for server side classes that are returned as RestApi Responses. As a example, consider the following 
C# Class that is returned as response to the get User API:

{% highlight c# %}

namespace App.Api
{
   public class User 
   {
       public string Name { get; set; }
       public DateTime DoB {get; set;
       public List<Address> Addresses { get; set; }
   }
   
   public class Address
   {
      public string City  {get; set;}
      public string State {get; set;}
   }
}
{% endhighlight %}

This will generate the following TypeScript declaration:

{% highlight js %}
declare module App.Api{
   interface User{
      Name: string;
      DoB: Date;
      Address: Address[];
   }
   
   interface Address{
      City: string;
      State: string;
   }
}
{% endhighlight %}

Now, you can use this type definition to define the return type of $http, like this:

{% highlight js %}
module App {
   export class userService {
   
      public static IName = "userService";
      public static $inject = ["$http", "$modal"];

      constructor(
         private $http: ng.IHttpService,
         private $modal: any) {
      }

      get(id: number): ng.IPromise<App.Api.User> {
         return this.$http.get('/api/users' + id.ToString()).
            then((response: ng.IHttpPromiseCallbackArg<App.Api.User>): App.Api.User => {
               return response.data;
            });
      }
   } 
}
{% endhighlight %}

## Use private parameters in constructors

If you are not using private constructor parameters, then you are probably doing this, where you manually map it to the private field of the class:

{% highlight js %}
module App {
   export class userService {
   
      public static IName = "userService";
      public static $inject = ["$http", '$modal'];
      
      private $http: ng.IHttpService;
      private $modal: any;

      constructor(
         $http: ng.IHttpService,
         $modal: any) {
            this.$http = $http;
            this.$modal = $modal;
      }

      get(id: number) {
         this.$http.get('/api/users' + id.ToString()).then();
      }
   } 
}
{% endhighlight %}

Save you time by prefixing constructor parameter with the private keyword parameter. TypeScript will automatically map private constructor parameters for you.


{% highlight js %}
module App {
   export class userService {
   
      public static IName = "userService";
      public static $inject = ["$http", "$modal"];

      constructor(
         private $http: ng.IHttpService,
         private $modal: any) {
      }

      get(id: number) {
         // private constructor parameters are automatically mapped for you.
         this.$http.get('/api/users' + id.ToString()).then();
      }
   } 
}
{% endhighlight %}

## Magic strings are bad

Don't use magic strings for controller, service or directive names or any where for that matter. Its a bad practice that will always waste your time. Always keep the name of the service or controller within the class as a static property and refrence it when you define it in angular. Here is an example service.

{% highlight js %}
module App {
   export class userService {
   
      public static IName = "userService";
      public static $inject = ["$http", "$modal"];

      constructor(
         private $http: ng.IHttpService,
         private $modal: any) {
      }

      get(id: number) {
         this.$http.get('/api/users' + id.ToString()).then();
      }
   } 
}
{% endhighlight %}


Then, register your service with angular like this:

{% highlight js %}
angular.service(App.userService.IName, App.userService);
{% endhighlight %}


