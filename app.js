const fs = require('fs'),
    path = require('path'),
    archiver = require('archiver'),
    configPath = './config.json';

//try to load the config, else write defaults
let config;
try {
    config = JSON.parse(fs.readFileSync(configPath));
}
catch(e) {
    config = {
        backupSource: '', //overseer 'data' folder, or whatever
        backupDestination: '', //network/cloud mounted folder to backup to
        name: '', //the name for this backup
        backupsPerYear: 52 //365 = daily, 52 = weekly, 12 = monthly etc.
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}

class Backup {
    constructor() {
        const msPerDay = 1000 * 60 * 60 * 24;
        //number of days between backups
        this.backupInterval = (365 / config.backupsPerYear) * msPerDay;
        console.log(`scheduling backups every ${this.backupInterval / msPerDay} days`);
        
        Backup.archive(); // run immediately
        setInterval(() => { // schedule a recurring run
            Backup.archive();
        }, this.backupInterval);
    }

    /**
     * Get a file name based on the config's defined name and the current time.
     * @returns {string}
     */
    static getFileName() {
        const d = new Date();
        //looks like: 'backup-1543184005655-2018-11-25-overseer.zip'
        return `backup-${d.getTime()}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${config.name}.zip`
    }
    
    /**
     * Archive the folder as a zip.
     */
    static archive() {
        const fn = Backup.getFileName(),
            outStream = fs.createWriteStream(path.join(config.backupDestination, fn)),
            archive = archiver('zip');
        console.log(`archiving ${config.name} as ${fn}`);
        
        archive.on('error', e => console.error(e));
        archive.pipe(outStream);
        archive.directory(config.backupSource, false);
        archive.finalize();
    }
}

//don't run the backup if the configuration isn't filled out properly
if (!config.backupSource || !config.backupDestination || !config.name || typeof config.backupsPerYear !== 'number' || config.backupsPerYear < 1) {
    console.warn('please fill out the config file and re-run');
}
else {
    const backup = new Backup();
}
