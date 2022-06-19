FROM ubuntu:latest

RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get -y install python3
RUN apt-get -y install python3-pip
RUN pip3 install nltk
RUN pip3 install pymorphy2
RUN python3 -m nltk.downloader all
RUN apt-get -y install npm

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

COPY . .
EXPOSE 3000

CMD ["node", "bin/www"]