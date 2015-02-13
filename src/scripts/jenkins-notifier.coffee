# Notifies about Jenkins build errors via Jenkins Notification Plugin
#
# Dependencies:
#   "url": ""
#   "querystring": ""
#
# Configuration:
#   Just put this url <HUBOT_URL>:<PORT>/hubot/jenkins-notify?room=<room> to your Jenkins
#   Notification config. See here: https://wiki.jenkins-ci.org/display/JENKINS/Notification+Plugin
#
# Commands:
#   None
#
# URLS:
#   POST /hubot/jenkins-notify?room=<room>[&type=<type>]
#
# Authors:
#   spajus

url = require('url')
querystring = require('querystring')
http = require 'http'

module.exports = (robot) ->

  robot.router.post "/hubot/jenkins-notify", (req, res) ->

    @failing ||= []
    query = querystring.parse(url.parse(req.url).query)

    res.end('')

    envelope = {}
    envelope.user = {}
    envelope.room = query.room if query.room
    envelope.user.type = query.type if query.type

    room = 'dev'

    try
      data = req.body

      if data.build.phase == 'STARTED'
        console.log "jenkins-notify: A build has started! Oooh, the excitement!!"
        if data.name == 'Mothra (QA)'
          http.get 'http://xserve:5051/mothra-qa', (res) ->
            console.log "MOTHRA!!"
            console.log res.statusCode
      if data.build.phase == 'COMPLETED'
        console.log "jenkins-notify: A build has finished! Oooh, the excitement!!"
        if data.build.status == 'FAILURE'
          console.log "Failure"
          if data.name in @failing
            build = "is still"
          else
            build = "started"
          robot.messageRoom room, "#{data.name} build ##{data.build.number} #{build} failing (#{encodeURI(data.build.full_url)})"
          @failing.push data.name unless data.name in @failing
          if data.name == 'Mothra (QA)'
            console.log "MOTHRA!!"
            console.log res.statusCode
            robot.messageRoom room, "Mothra has the upper hand!"
            robot.messageRoom room, "http://i.imgur.com/CoqJxBx.gif"
        if data.build.status == 'SUCCESS'
          console.log "Success"
          if data.name in @failing
            index = @failing.indexOf data.name
            @failing.splice index, 1 if index isnt -1
            robot.messageRoom room, "#{data.name} build is fixed! ##{data.build.number} (#{encodeURI(data.build.full_url)})"
          else
            console.log "Sending success"
#            robot.messageRoom "#dibsy-dev", "#{data.name} build succeeded! ##{data.build.number} (#{encodeURI(data.build.full_url)})"
            robot.messageRoom room, "#{data.name} build succeeded! ##{data.build.number} (#{encodeURI(data.build.full_url)})"
          if data.name == '1stdibs.com Deploy Production PROD PROD PROD PROD'
            console.log "LEEEEEEEEEEEROOOOOOOOOOOOOY"
            http.get 'http://xserve:5051/shipit', (res) ->
              console.log "JEEEEEEEEEEEEEENKIIIIIIIIINS"
              console.log res.statusCode
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.name == 'Admin-v2 Deploy (PROD)'
            console.log "LEEEEEEEEEEEROOOOOOOOOOOOOY"
            http.get 'http://xserve:5051/shipit-adminv2', (res) ->
              console.log "JEEEEEEEEEEEEEENKIIIIIIIIINS"
              console.log res.statusCode
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.name == 'Admin-v1 Deploy (PROD) (RACKSPACE)'
            console.log "LEEEEEEEEEEEROOOOOOOOOOOOOY"
            http.get 'http://xserve:5051/shipit-adminv1', (res) ->
              console.log "JEEEEEEEEEEEEEENKIIIIIIIIINS"
              console.log res.statusCode
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.name == 'JAVA-InventoryService (Prod)'
            console.log "LEEEEEEEEEEEROOOOOOOOOOOOOY"
            http.get 'http://xserve:5051/shipit-inventory', (res) ->
              console.log "JEEEEEEEEEEEEEENKIIIIIIIIINS"
              console.log res.statusCode
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.name == 'JAVA-InventoryService-Logistics (PROD)'
            console.log "LEEEEEEEEEEEROOOOOOOOOOOOOY"
            http.get 'http://xserve:5051/shipit-inventory', (res) ->
              console.log "JEEEEEEEEEEEEEENKIIIIIIIIINS"
              console.log res.statusCode
            robot.messageRoom "#release", "I hope you know what you're doing..."
          if data.name == 'JAVA-IdentityService (Prod)'
            console.log "LEEEEEEEEEEEROOOOOOOOOOOOOY"
            http.get 'http://xserve:5051/shipit-identity', (res) ->
              console.log "JEEEEEEEEEEEEEENKIIIIIIIIINS"
              console.log res.statusCode
            robot.messageRoom "#release", "I hope you know what you're doing..."

    catch error
      console.log "jenkins-notify error: #{error}. Data: #{req.body}"
      console.log error.stack
