---
layout: post
title: Objective C cheatsheet
date: 2023-08-15 09:00:00 -04:00
categories: post
permalink: /:categories/:year/:month/:day/:title/
image: assets/profile.JPG
---

Quick reference guide when you need to do some objective C

# What is Objective-C

Objective-C aims to add **Objects** to the C language, they did this by adding SmallTalk-like message passing to C.

On practical terms and in our day and age: this means funny syntax when declaring classes and instead of calling methods you send messages.

I suggest you learn some C (or C++) first. A lot of the knowledge (pointers, pass-by-value, pass-by-reference) is shared.

# `NS-`Fu

All the NS classes where created by the NeXT team and are the base objects which are used to interact with the base API of the language. They all come from the `Foundation` framework.

Some of them are: `NSLog`, `NSString`, `NSDictionary`, `NSArray` and so on. That is why you will always end up importing the `Foundation.h` header file at the top of your obj-c code.

# Pass by reference

You will notice everytime you pass around a object you will need to pass it as a pointer. Sometimes this means you will loose typesafety and will need to internally cast the pointer to a more specific type

```objectivec
// Untyped (int? object?) array
*NSArray doSomething {
	NSArray *myArray = @[...];
	return myArray;
}
```

# @ Macro

The "**@**" is a special macro (read text expansion) to instantiate certain classes, e.g. NSString

```objectivec
#import <Foundation/Foundation.h>

int main() {
	NSLog(@"I'm a string");

	NSDictionary *myDict = @{ @"Who am I": @"A dictionary"};

	return 0
}
```

# Classes

```objectivec
@interface MyObj:NSObject
// Methods and properties declarations
@end

@implementation MyObj
// Actual definition
@end

int main() {
	// Instatiation = Allocation + Constructor
	MyObj *obj = [[MyObj alloc] init];
	return 0;
}
```

The definition of methods and properties goes inside the `@interface` block. The actual implementation inside the `@implementation` block.  It is also necessary to inherit from `NSObject` which the base class for any object.

## Class properties

Adding class properties you can actually interact with from code outside the class

```objectivec
// interface
@interface MyObj: NSObject {
	int age;
}

@property(nonatomic, readwrite) int age; // writable instance property

@end

// declaration
@implementation MyObj

@end

int main() {
	MyObj *obj = [[MyObj alloc] init];
	obj.age = 20;
	NSLog(@"Age %d", obj.age);

	return 0;
}
```

## Class methods

You should be able to read the language like you read a normal english sentence, IMO that idea that has aged poorly.

```objectivec
// interface
@interface MyObj: NSObject {
+(int)getAnswerStatic;
-(int)getAnswer
-(int)setAnswer: (int)num;
}

@property(nonatomic, readwrite) int answer; // writable instance property

@end

// declaration
@implementation MyObj
	+(int)getAnswerStatic {
		return 42;
	}

	-(int)getAnswer {
		return self.answer;
	}

	-(int)setAnswer: (int)num {
		self.answer = num;
	}
@end

int main() {
	NSLog(@"%d", [MyObj getAnswerStatic]); // 42

	MyObj *obj = [[MyObj alloc] init];
	NSLog(@"%d", [MyObj getAnswer]); // 0

	[MyObj setAnswer num:52];
	NSLog(@"%d", [MyObj getAnswer]); // 52

	return 0;
}
```

Important to note the `+` and `-` prefixes. `+` means static method (class level) and `-` means instance method (object level).

## Constructors

```objectivec
// interface
@interface Person: NSObject {
	NSString *name
	NSInteger age;
}

- (id)initWithName:(NSString *)name andAge:(NSInteger *)age;
- (void)print;

@end

// declaration
@implementation Person
	-(id)initWithName:(NSString *)name andAge:(NSInteger *)age {
		self.name = name;
		self.age = age;
		return self;
	}

	-(void)print {
		NSLog(@"Person instance. name: %@, age: %@", self.name, self.age);
	}
@end

int main() {
	Person *person = [[Person alloc] initWithName: @"Oscar" andAge:5];
	[person print];
	return 0;
}
```

# Obj-C++

If you change the extension of you file from `.m` to `.mm` you will change the language to Obj-C++. It is basically C++ and Obj-C mixed together. 

There will be a lot of caveats when you using it: You cannot call Obj-C methods using C++ syntax and so forth. But, it does allow to use and mix C++ classes and syntax inside Obj-C code. Very useful to re-use already existing modules.

Here is an example of a JSI function (C++) calling a Obj-C API: