var pmx = require('pmx');
var pm2 = require('pm2');
var vizion = require('vizion');
var child = require('child_process')
var Promise = require('bluebird')
var async = require('async')

pmx.initModule({

    // Options related to the display style on Keymetrics
    widget: {


        logo: 'https://app.keymetrics.io/img/logo/keymetrics-300.png', //MUST BE https
        //include img in package and use that?

        // Module colors
        // 0 = main element
        // 1 = secondary
        // 2 = main border
        // 3 = secondary border
        theme: ['#141A1F', '#222222', '#3ff', '#3ff'],

        // Section to show / hide
        el: {
            probes: true,
            actions: true //probably hide this
        },

        // Main block to show / hide
        block: {
            actions: false,
            issues: true,
            meta: true,

            // Custom metrics to put in BIG
            main_probes: ['App Updated Count']
        }

    }

}, function (err, conf) {


    var Probe = pmx.probe();

    var updated = 0;


    var val = Probe.metric({
        name: 'App Updated Count',
        value: function () {
            return updated;
        },
        /**
         * Here we set a default value threshold, to receive a notification
         * These options can be overriden via Keymetrics or via pm2
         * More: http://bit.ly/1O02aap
         */
        /*alert: {
         mode: 'threshold',
         value: 20,
         msg: 'test-probe alert!',
         action: function (val) {
         // Besides the automatic alert sent via Keymetrics
         // You can also configure your own logic to do something
         console.log('Value has reached %d', val);
         }
         }*/
    });


    // getting this working once pm2 fixes it would be dope
    /* pm2.pullAndReload("asahi", function(err, out) {
     console.log(err)
     console.log(out)
     running = false;
     });
     */


    pmx.action('env', function (reply) {
        return reply({
            env: process.env
        });
    });

    pm2.connect(function () {
        console.log("connected")
        var running = false;
        //var chain = Promise.resolve();

        setInterval(function () {
            //console.log(conf.module_conf)


            if (running == true) return false;

            running = true;

            //TODO if multiple processes in the future, will need to have array for folders and processes in package.json
            vizion.update(
                {folder: conf.module_conf.folder_path},
                function (err, meta) {
                    console.log("meta", meta);
                    console.log("err", err);
                    if (meta && meta.success) {
                        //TODO need to run post update commands on my own here! yippeeee
                        //in the future, pullAndReload takes care of this but for whatever reason, that still doesn't work
                        execCommands(conf.module_conf.folder_path,
                            ["npm update","cd assets;bower update","echo HELLO", "pm2 restart process.json"],
                            function(err, meta) {
                            if (err !== null)
                            {
                                vizion.prev({folder: proc.pm2_env.versioning.repo_path}, function(err2, meta2) {
                                    console.log(err);
                                    console.log(meta)
                                    return meta.output;
                                });//TODO this could setup a rollback if something happens
                            }
                            else {
                                pm2.reload(conf.module_conf.proc_name);
                            }
                        });


                        updated++;

                    }
                    running = false;
                }
            );
            /*pm2.pullAndReload(conf.module_conf.proc_name, function(err, meta){
                console.log("meta", meta);
                console.log("err", err);
            });*/
        })
    }, 3000);


});



var exec = function (cmd, callback) {
    var output = '';

    var c = child.exec(cmd, {},
        function(err) {
            if (callback)
                callback(err ? err.code : 0, output);
        });

    c.stdout.on('data', function(data) {
        output += data;
    });

    c.stderr.on('data', function(data) {
        output += data;
    });
};

/**
 *
 * @method execCommands
 * @param {string} repo_path
 * @param {object} command_list
 * @return
 */
var execCommands = function(repo_path, command_list, cb) {
    var stdout = '';

    async.eachSeries(command_list, function(command, callback) {
        stdout += '\n' + command;
        exec('cd '+repo_path+';'+command,
            function(code, output) {
                stdout += '\n' + output;
                console.log(stdout);
                if (code === 0)
                    callback();
                else
                    callback('`'+command+'` failed');
            });
    }, function(err) {
        if (err)
            return cb(stdout + '\n' + err);
        return cb(null, stdout);
    });
}