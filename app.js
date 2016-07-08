var pmx = require('pmx');
var pm2 = require('pm2');
var Promise = require('bluebird');
var vizion = require('vizion');
//var child = require('child_process');

/******************************
 *    ______ _______ ______
 *   |   __ \   |   |__    |
 *   |    __/       |    __|
 *   |___|  |__|_|__|______|
 *
 *      PM2 Module Sample
 *
 ******************************/

/**
 *    Module system documentation
 *       http://bit.ly/1hnpcgu
 *
 *   Start module in development mode
 *          $ cd to my-module
 *          $ pm2 install .
 *
 *  Official modules are published here
 *      https://github.com/pm2-hive
 */

/**
 *           Module Entry Point
 *
 *  We first initialize the module by calling
 *         pmx.initModule({}, cb);
 *
 *
 * More options: http://bit.ly/1EpagZS
 *
 */
pmx.initModule({

    // Options related to the display style on Keymetrics
    widget: {

        //TODO logo and stuff would be cool :)
        // Logo displayed
        logo: 'https://app.keymetrics.io/img/logo/keymetrics-300.png',
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

    /**
     * Module specifics like connecting to a database and
     * displaying some metrics
     */

    /**
     *                      Custom Metrics
     *
     * Let's expose some metrics that will be displayed into Keymetrics
     *   For more documentation about metrics: http://bit.ly/1PZrMFB TODO
     */
    var Probe = pmx.probe();

    var updated = 0;

    /**
     * .metric, .counter, .meter, .histogram are also available (cf doc) //TODO research these
     */
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


    setInterval(function () {
        console.log(conf.module_conf)

        //TODO decide between chain and running boolean. Running is how pm2-auto-pull is done but chaining might
        // be better coding
        var chain = Promise.resolve();
        var running = false;


        if (running == true) return false;

        running = true;

        vizion.update(
            { folder: '/opt/asahi' }, //TODO TEST with /opt/asahi :( conf.module_conf.folder_path
            function (err, meta) {
                console.log("meta", meta);
                console.log("err", err);
                if (meta.success) {
                    //child.exec("cd /opt/dev/source && pm2 reload process.json --only asahi")
                    pm2.reload('asahi');//conf.module_conf.proc_name); //config in package.json rn but might wanna change it? base off folder?
                    updated++;

                }
                running = false;
            }
        );

        //TODO getting this working once pm2 fixes it would be dope
       /* pm2.pullAndReload("asahi", function(err, out) {
            console.log(err)
            console.log(out)
            running = false;
        });
*/



    }, 3000);



    /**
     *                Simple Actions
     *
     *   Now let's expose some triggerable functions
     *  Once created you can trigger this from Keymetrics
     *
     */
    //TODO checkout other options for pmx actions - could add some cool integrations
    pmx.action('env', function (reply) {
        return reply({
            env: process.env
        });
    });


    /**
     *                 Scoped Actions
     *
     *     This are for long running remote function
     * This allow also to res.emit logs to see the progress
     * TODO get rid of this - probably don't need scoped actions
     **/
    var spawn = require('child_process').spawn;

    pmx.scopedAction('lsof cmd', function (options, res) {
        var child = spawn('lsof', []);

        child.stdout.on('data', function (chunk) {
            chunk.toString().split('\n').forEach(function (line) {
                /**
                 * Here we send logs attached to this command
                 */
                res.send(line);
            });
        });

        child.stdout.on('end', function (chunk) {
            /**
             * Then we emit end to finalize the function
             */
            res.end('end');
        });

    });


    /*pm2.connect(function () {
        console.log('auto-reload2 module connected to pm2');

    })*/


});
