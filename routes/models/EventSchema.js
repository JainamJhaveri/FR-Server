/**
 * Created by jainamjhaveri on 08/06/17.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// events ( eventName, eventDescription, eventDate, eventImageUrl, created: {by, timeStamp}, edited: {by, timeStamp} )

var EventSchema = new Schema({
    eventName: {
        type: String,
        required: [true, 'Event Name is not given']
    },
    eventDescription: {
        type: String,
        required: [true, 'Event Description is required']
    },
    eventDate: {
        type: Date,
        required: [true, 'Event Date is not given']
    },
    eventImageUrl: {
        type: String,
        required: [true, 'Event Image Url is not given']
    },
    created: {
        by: {
            type: Schema.ObjectId
        },
        timeStamp: {
            type: Date
        }
    },
    edited: {
        by: {
            type: Schema.ObjectId
        },
        timeStamp: {
            type: Date,
            default: Date.now
        }
    }

});

EventSchema.index({eventName: 1}, {unique: true});

var ExportableEventSchema = mongoose.model('Events', EventSchema);

module.exports = {
    EventSchema: ExportableEventSchema
};