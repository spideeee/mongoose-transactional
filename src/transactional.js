const mongoose = require("mongoose");

module.exports = function transactional(models, fn){
    if (!models || models.length === 0){
        throw new Error("Do not use transactional without any model.");
    }
    if(typeof fn !== "function"){
        throw new Error("Expected function, but received " + (typeof fn));
    }


    let wrappedModels = {};
    
    return async function(...args){
        let session = await mongoose.connection.startSession();
        session.startTransaction();
        
        let modelKeys = Object.keys(wrappedModels);
        if(modelKeys.length === 0){
            wrappedModels = wrapModels(models, session);
        } else {
            modelKeys.forEach(key => wrapModels[key].$$session(session));
        }

        let response;
        try {
            if(fn[Symbol.toStringTag] === "AsyncFunction"){
                response = await fn(wrappedModels, ...args); 
            } else {
                response = fn(wrappedModels, ...args);    
            }
            await session.commitTransaction();
            session.endSession();
            return response;
        } catch (error){
            await session.abortTransaction();
            throw error;
        }
    }
}

function wrapModels(models, session){
    let wrappedModels = {};
    models.forEach((model) => {
        if(typeof model === "string"){
            model = mongoose.model(model);
        }
        wrappedModels[model.modelName] = wrapModel(model, session);
    });
    return wrappedModels;
}

function wrapModel(modelToWrap, session){
    function ModelWrapper(){
        throw new Error("Initialization not supported, this is a ModelWrapper for - " + modelToWrap.modelName);
    }
    // console.log(Object.getOwnPropertyNames(modelToWrap));

    // console.log(modelToWrap.schema);
    // console.log(Object.keys(mongoose.Model));
    Object.keys(mongoose.Model).forEach((key) => {
        // console.log(key);
        if(typeof modelToWrap[key] === "function"){
            ModelWrapper[key] = function(...args){
                let value = modelToWrap[key].apply(modelToWrap, ...args);
                if(typeof value.session === "function"){
                    value.session(this.$$sessionInstance)
                }
                return value;
            }
        } else {
            Object.defineProperty(ModelWrapper, key, {
                get: function(){
                    return modelToWrap[key];
                },
                set: function(value){
                    modelToWrap[key] = value;
                }
            });
        }
    });

    // this function is used in place of new Model()
    ModelWrapper.new = function(...args){
        let value = new modelToWrap(...args);
        if(typeof value.$session === "function"){
            value.$session(this.$$sessionInstance);
        }
        return value;
    }

    ModelWrapper.$$session = function(session){
        this.$$sessionInstance = session;
    }

    ModelWrapper.$$sessionInstance = null;

    ModelWrapper.$$session(session);

    return ModelWrapper;
}