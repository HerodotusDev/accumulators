FROM --platform=linux/amd64 ubuntu:latest
USER root

RUN apt-get update &&\
    apt-get install -y curl git &&\
    curl -L https://raw.githubusercontent.com/software-mansion/protostar/master/install.sh | bash -s -- -v 0.7.0 &&\
    git clone https://github.com/HerodotusDev/herodotus-eth-starknet.git /contracts &&\
    cd /contracts &&\
    /root/.protostar/dist/protostar/protostar build

WORKDIR /contracts

CMD ["ls", "-la"]