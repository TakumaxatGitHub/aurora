################################################################################
CXX         = g++
CXXFLAGS    = -Wall -Wno-unused -msse3 -fPIC

VISO2_DIR   = $(shell pwd)
INCLUDES    = -I$(VISO2_DIR)/src -I/usr/local/include
LIBS        = 
SRCS        = $(wildcard src/*.cpp)
OBJS        = $(SRCS:cpp=o)

TARGET      = $(shell basename $(shell pwd))

################################################################################

all: lib

lib: $(TARGET)_base.so

install:
	if [ ! -f ../$(TARGET)_base.so ]; then cd .. && ln -s $(TARGET)/$(TARGET)_base.so; fi

.PHONY: clean
clean: 
	rm -f *.o *.so src/*.o

################################################################################

$(TARGET)_base.so: $(OBJS)
	$(CXX) -shared $(LIBS) $(OBJS) -o $@

%.o: src/%.c
	$(CXX) $(CXXFLAGS) $(INCLUDES) -fPIC -c $< -o $@

################################################################################

