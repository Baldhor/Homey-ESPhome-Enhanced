Just a basic readme for myself ...

The concept here is based on homey-heating application.
To be honest I don't understand all, partially because it is based on TypeScript, so I just tried to convert it to JavaScript the way I could :)

I first tried to use the console.re client, and it was working in a simple way.
However, the client is heavy, and I noticed the application size was way too much ...
So I decided to switch to socket.io in the purpose to reduce the dependancies!

The idea is as follow :
- A LogService class provide basic functionnalities:
  - Log function at 4 levels: debug, info, warn and error
  - Test if a log level is active: allow to optimize CPU/memory intensive log
  - Embed 3 kinds of log:
    - Default logger:
      - Applicative: Homey native logs
      - Console: Browser console logs
    - Console.re: One log consummer to control them all, using socket.io to interface with console.re server
  - Console.re logs can fail, in such case a log must be traced but only at application / console level (to avoid infinite loop) => which is why there are the "default logger"
  - LogService is a singleton and should not be used directly, it is embedded in the CategoryLogger! Aside from initialization!
- Category logger:
  - It is actually the class to use to create a logger
  - The idea is to create a logger for each purpose: app, driver, device, manager, ...
  - However, because I have currently no idea how to detect automatically if the execution is currently on the application level or console level, it is important to create a different categaroy logger

How to use?
  - Initialize the LogService:
    - First based on settings (channel/label)
    - Listen to settings change to update configuration on the go
  - Create a categoryLogger when needed inside the init functions (app, driver, manager, device, pairing...)
    - use it in the right context ...
