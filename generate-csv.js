// node generate-csv.js

const fs = require('fs')
const path = require('path')
const csvParser = require('csv-parser')
const csvWriter = require('csv-writer')

generateCSV()

/**
 * Generates CSV files compatible with Disperse.app, Gnosis Safe and Parcel.
 */
function generateCSV() {
    console.log('generateCSV')

    // Iterate the CSV files generated by SourceCred in output/grainIntegration/
    fs.readdir('output/grainIntegration/', function(err, files) {
        if (err) {
            console.error(err)
            return
        }
        
        files.forEach(function(file, index) {
            const filePath = path.join('output/grainIntegration/', file)
            if (filePath.endsWith('.csv') 
                    && !filePath.endsWith('_disperse.csv') 
                    && !filePath.endsWith('_gnosis.csv')
                    && !filePath.endsWith('_parcel.csv')) {
                // Read the rows of data from the CSV file
                let csvRows = []
                fs.createReadStream(filePath)
                    .pipe(csvParser(['receiver', 'amount']))
                    .on('data', (row) => insertRow(csvRows, row))
                    .on('end', () => {
                        console.log('\nfilePath', filePath)
                        console.log('csvRows:\n', csvRows)

                        // Convert amount format
                        convertAmountFormat(csvRows)

                        csvRows = pruneRows(csvRows);

                        // Generate CSV for Disperse.app
                        filePathDisperse = filePath.replace('.csv', '_disperse.csv')
                        console.log('filePathDisperse', filePathDisperse)
                        writeToDisperseCSV(filePathDisperse, csvRows);

                        // Generate CSV for Gnosis Safe
                        filePathGnosis = filePath.replace('.csv', '_gnosis.csv')
                        console.log('filePathGnosis', filePathGnosis)
                        writeToGnosisCSV(filePathGnosis, csvRows)

                        // Generate CSV for Parcel
                        filePathParcel = filePath.replace('.csv', '_parcel.csv')
                        console.log('filePathParcel', filePathParcel)
                        writeToParcelCSV(filePathParcel, csvRows)
                    })
            }
        })
    })
}

function insertRow(rows, row) {
    let newRow = {};
    newRow.receiver = row.receiver
    newRow.amount = row.amount
    newRow.name = ''
    newRow.token_type = 'erc20'
    newRow.token_address = '0x333A4823466879eeF910A04D473505da62142069'

    rows.push(newRow)
}

function pruneRows(rows) {
    const floor = 0.002;
    let pruned = rows.filter(row => row.amount > floor);
    return pruned;
}

/**
 * Convert the amount column to 18 decimal format:
 *   0x3e465ABFa9b2A7E18a610F489fb3510765461d13,"7718330904890492"
 *   -->
 *   0x3e465ABFa9b2A7E18a610F489fb3510765461d13,0.007718330904890492
 */
function convertAmountFormat(csvRows) {
    console.log('convertAmountFormat')

    csvRows.forEach(function(row, index) {
        // Prepend zeros
        while (row.amount.length <= 18) {
            row.amount = "0" + row.amount
        }

        // Add decimal
        row.amount = row.amount.substring(0, row.amount.length - 18) + "." + row.amount.substring(row.amount.length - 18, row.amount.length)
    })
}

function writeToDisperseCSV(filePathDisperse, csvRows) {
    console.log('writeToDisperseCSV')

    const writer = csvWriter.createObjectCsvWriter({
        path: filePathDisperse,
        header: ['receiver', 'amount']
    })

    writer.writeRecords(csvRows)
}

function writeToGnosisCSV(filePathGnosis, csvRows) {
    console.log('writeToGnosisCSV')

    // Add missing columns
    csvRows.forEach(function(row, index) {
        row.token_type = 'erc20'
        row.token_address = '0x333A4823466879eeF910A04D473505da62142069'
    })
    
    const writer = csvWriter.createObjectCsvWriter({
        path: filePathGnosis,
        header: [
            {id: 'token_type', title: 'token_type'},
            {id: 'token_address', title: 'token_address'},
            {id: 'receiver', title: 'receiver'},
            {id: 'amount', title: 'amount'},
            {id: 'id', title: 'id'}
        ]
    })

    writer.writeRecords(csvRows)
}

function writeToParcelCSV(filePathParcel, csvRows) {
    console.log('writeToParcelCSV')

    const writer = csvWriter.createObjectCsvWriter({
        path: filePathParcel,
        header: [
            {id: 'name', title: 'Name(Optional)'},
            {id: 'receiver', title: 'receiver'},
            {id: 'amount', title: 'amount'},
            {id: 'token_address', title: 'token_address'}
        ]
    })

    writer.writeRecords(csvRows)
}
