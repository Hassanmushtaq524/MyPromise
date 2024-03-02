const STATE = {
    FULLFILLED: "fullfilled",
    REJECTED: "rejected",
    PENDING: "pending"
};

// Custom implementation of a promise
class MyPromise {

    #thenCbs = [];
    #catchCbs = [];
    #state = STATE.PENDING;
    #value;
    #onSuccessBind = this.#onSuccess.bind(this);
    #onFailBind = this.#onFail.bind(this);

    constructor(callBack) {
        try {
            // resolve -> this.#onSuccess
            // reject -> this.#onFail
            callBack(this.#onSuccessBind, this.#onFailBind);
        } catch (error) {
            this.#onFail(error);
        }
    }

    // run all the callbacks on success
    #runCallbacks() {
        // success state
        if (this.#state === STATE.FULLFILLED) {
            // call all of the then callbacks in order of adding
            for (let cb of this.#thenCbs) {
                cb(this.#value)
            }

            this.#thenCbs = [];
        }
        // failure state
        if (this.#state === STATE.REJECTED) {
            // call all of the then callbacks in order of adding
            for (let cb of this.#catchCbs) {
                cb(this.#value);
            }

            this.#catchCbs = [];     
        }
    }

    // when the code in the promise runs, we run this.#onSuccess function, we call the
    // then function and pass the value
    #onSuccess(value) {
        queueMicrotask(() => {
            if (this.#state !== STATE.PENDING) { return; }
    
            // in the previous .then(), we can have a returned MyPromise
            if (value instanceof MyPromise) {
                value.then(this.#onSuccessBind, this.#onFailBind);
                return;
            }
    
            this.#value = value;
            this.#state = STATE.FULLFILLED;
    
            this.#runCallbacks();
        })
        
    }
    // if the code fails and we reject, we are going to call the catch and pass the error
    #onFail(value) {
        queueMicrotask(() => {
            if (this.#state !== STATE.PENDING) { return; }
    
            if (value instanceof MyPromise) {
                value.then(this.#onSuccessBind, this.#onFailBind);
                return;
            }
            
            // this means we dont have any catch to catch an error
            if (this.#catchCbs.length === 0) {
                throw new UncaughtPromiseError(value);
            }

            this.#value = value;
            this.#state = STATE.REJECTED;
    
            this.#runCallbacks();
        })
    }

    // when this is called, we save the callback function for later, until promise is resolved
    then(thenCb, catchCb) {
        return new MyPromise((resolve, reject) => { 
            this.#thenCbs.push(result => {
                if (thenCb == null) {
                    resolve(result);
                    return;
                }

                try {
                    resolve(thenCb(result));
                } catch (error) {
                    reject(error);
                }
            })

            this.#catchCbs.push(result => {
                if (catchCb == null) {
                    reject(result);
                    return;
                }

                try {
                    resolve(catchCb(result));
                } catch (error) {
                    reject(error);
                }
            })
            
            this.#runCallbacks(); 
        })

    }

    catch(catchCb) {
        return this.then(undefined, catchCb);
    }

    finally(cb) {
        return this.then(result => {
            cb();
            return result;
        }, result => {
            cb();
            throw result;
        });
    }

    // static methods

    static resolve(value) {
        return new MyPromise((resolve, reject) => {
            resolve(value);
        })
    }

    static reject(value) {
        return new MyPromise((resolve, reject) => {
            reject(value);
        })
    }

    static all(promises) {
        const results = [];
        let completedPromises = 0;
        return new MyPromise((resolve, reject) => {
            for (let i = 0; i < promises.length; i++) {
                const promise = promises[i];

                promise.then(value => {
                    completedPromises++;
                    results[i] = value;
                    if (completedPromises === promises.length) {
                        resolve(value);
                    }
                }).catch(reject);

            }
        })
    }

    

}


class UncaughtPromiseError extends Error {
    constructor(error) {
        super(error);

        this.stack = `(in promise) ${error.stack}`;
    }
}


let m = new MyPromise((resolve, reject) => {
    // Some code
    resolve(400);
})

m.then((val) => {
    console.log(val);
})

module.exports = MyPromise;