/**
 * Created by jainamjhaveri on 08/06/17.
 */



// event-images ( eventId, userId, files: images: [] { imageUrl, uploadTimeStamp, caption }, videos: [] { videoUrl, uploadTimeStamp, caption } )

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EventImagesSchema = new Schema({
    eventId: {
        type: Schema.ObjectId,
        required: [true, 'Event Name is not given']
    },
    userId: {
        type: Schema.ObjectId,
        required: [true, 'UserId is not given!']
    },
    files: {
        images: [
            {
                imageUrl: {
                    type: String,
                    required: true
                },
                uploadTimeStamp: {
                    type: Date,
                    default: Date.now
                },
                caption: {
                    type: String
                }
            }
        ],
        videos: [
            {
                videoUrl: {
                    type: String,
                    required: true
                },
                uploadTimeStamp: {
                    type: Date,
                    default: Date.now
                },
                caption: {
                    type: String
                }
            }
        ]
    }
}, {strict: true});


var ExportableEventImagesSchema = mongoose.model('EventImage', EventImagesSchema);

module.exports = {
    EventImagesSchema: ExportableEventImagesSchema
};