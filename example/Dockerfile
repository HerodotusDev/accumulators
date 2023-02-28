FROM --platform=linux/amd64 shardlabs/starknet-devnet

# RUN apt-get install -y bash

# SHELL ["/bin/bash", "-c"]

RUN apt-get update &&\
    apt-get install -y curl git libc6 &&\
    curl -L https://raw.githubusercontent.com/software-mansion/protostar/master/install.sh | bash &&\
    . /root/.bashrc &&\
    which python3 &&\
    protostar --version &&\
    git clone https://github.com/HerodotusDev/herodotus-eth-starknet.git

