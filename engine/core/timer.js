export class Timer {
    // second representation
    static second = 1000;

    // to second transform
    static toSecond = 1 / Timer.second;

    // previous time
    previousTime;

    // current time
    currentTime;

    // delta time
    deltaTime;

    // delta time in seconds
    deltaTimeSeconds;

    // fixed delta time
    fixedDeltaTime;

    // fixed delta time in seconds
    fixedDeltaTimeSeconds;

    // fixed time accumulator
    fixedTimeAccumulator = 0;

    // pending fixed updates
    pendingFixedUpdates = 0;

    // Set fixed update count
    setFixedUpdateCount(fixedUpdateCount) {
        this.fixedDeltaTime = Timer.second / fixedUpdateCount;
        this.fixedDeltaTimeSeconds = this.fixedDeltaTime * Timer.toSecond;
    }

    // update properties
    update() {

        // get current time
        const currentTime = performance.now();

        // get previous time
        this.previousTime = this.currentTime || currentTime;

        // get current time
        this.currentTime = currentTime;

        // compute delta time
        this.deltaTime = this.currentTime - this.previousTime;

        // compute delta time in seconds
        this.deltaTimeSeconds = this.deltaTime * Timer.toSecond;

        // accumulate fixed time
        this.fixedTimeAccumulator += this.deltaTime;

        // compute current pending fixed updates
        const currentPendingFixedUpdates = Math.floor(this.fixedTimeAccumulator / this.fixedDeltaTime);

        // recompute fixed time accumulator
        this.fixedTimeAccumulator -= currentPendingFixedUpdates * this.fixedDeltaTime;

        // compute total pending fixed updates
        this.pendingFixedUpdates += currentPendingFixedUpdates;
    }
}