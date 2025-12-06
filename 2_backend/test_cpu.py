import time
start = time.time()
while time.time() - start < 1:
    pass # Busy wait to consume CPU
